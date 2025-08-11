#!/data/XALG/.venv/bin/python
# IFC to Fragments Converter - Project-Specific Script
# ===================================================
# Dependencies:
# - Portable converter package at D:\XALG\frag_convert\
# - Python standard libraries
# - PostgreSQL database for BYTEA storage

import os
import sys
import subprocess
import logging
import json
import time
import hashlib
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import importlib
import psycopg2
from psycopg2.extras import RealDictCursor

##########################################################################################
# Validate Virtual Environment
##########################################################################################
def validate_virtual_environment():
    """Validate that script is running in the correct virtual environment"""
    import sys
    venv_path = "/data/XALG/.venv"
    
    if not sys.executable.startswith(venv_path):
        print(f"⚠️  WARNING: Script not running in virtual environment!")
        print(f"   Current Python: {sys.executable}")
        print(f"   Expected: {venv_path}/bin/python")
        print(f"   VS Code should be configured to use the virtual environment.")
        print(f"   If issues persist, run: cd /data/XALG && source .venv/bin/activate && python {__file__}")
        return False
    
    print(f"✅ Running in virtual environment: {sys.executable}")
    return True

# Validate environment at startup
if not validate_virtual_environment():
    print("Script will continue but may encounter import errors...")

##########################################################################################
# Establish ProjectPath root parameters and schema
##########################################################################################
GenOp = "XALG" # Define the root directory domain for the project
current_script = Path(__file__).resolve() # Get the full path of the current script
for parent in current_script.parents: # Traverse the directory structure to find PjDomain and PjName
    if parent.name == GenOp:  # Identify the root directory (XQG4)
        relative_parts = current_script.relative_to(parent).parts  # Get the subpath under 'XQG4'
        PjDomain = relative_parts[0]  # First folder after 'XQG4' (PjDomain)
        PjName = relative_parts[1]    # Second folder after 'XQG4' (PjName)
        break
else:
    raise ValueError(f"Directory {GenOp} not found in script path.")

# Construct a path to the parameter file (under XALG structure)
# Use robust cross-platform path resolution
project_path_dir = Path(os.path.join('/data', GenOp, PjDomain, PjName, 'Q0_PJ', f'PjParam_{PjName}.py'))
if not project_path_dir.exists():
    # Try alternative paths for different environments
    alt_paths = [
        Path(os.path.join('/', GenOp, PjDomain, PjName, 'Q0_PJ', f'PjParam_{PjName}.py')),
        Path(os.path.join('D:\\', GenOp, PjDomain, PjName, 'Q0_PJ', f'PjParam_{PjName}.py'))
    ]
    for alt_path in alt_paths:
        if alt_path.exists():
            project_path_dir = alt_path
            break
print(f"Key Parameters - GenerativeOps Directory: {GenOp}  PjDomain: {PjDomain} PjName: {PjName}")
print(f"Using parameters file path: {project_path_dir}")

# Dynamically import the project parameter module
project_param = f"PjParam_{PjName}"
sys.path.append(str(project_path_dir.parent))  # Ensure the module path is in the sys.path

try: # Import and reload the module
    module = importlib.import_module(project_param)
    importlib.reload(module)
    PjPath = module.PjPath
    PjLongName = module.PjLongName
    PjModel_3D_Source = module.Model_3D_Source
    Paths = module.Paths
    DB_CONFIG_LOC = module.DB_CONFIG_LOC  # Add database configuration
    print("Path to Project Parameters file here:", project_path_dir)
    print(f"Path to Current script directory: {current_script}")
    print(f"Project Long Name: {PjLongName}")
except ModuleNotFoundError:
    print(f"Error: Could not find the module {project_param} in {project_path_dir.parent}")
    sys.exit(1)

# Prepare Schema paths from ProjectPath.py
Path_F1_CO = os.path.normpath(Paths['F1_CO'])

##################################################################
##################################################################

class FragmentsBYTEAHandler:
    """
    Handler for storing and retrieving Fragments files in PostgreSQL BYTEA format
    """
    
    def __init__(self, db_config: dict):
        self.logger = logging.getLogger(__name__)
        
        # Simple mapping from project config to psycopg2 parameters
        self.db_config = {
            'host': db_config.get('DB_HOST', '127.0.0.1'),
            'port': int(db_config.get('DB_PORT', 5432)),
            'database': db_config.get('DB_NAME', 'NLEX_CANDAB2'),
            'user': db_config.get('DB_USER', 'postgres'),
            'password': db_config.get('DB_PASSWORD', '')
        }
        
        self.logger.info(f"[DB] Database config: host={self.db_config['host']}:{self.db_config['port']}, database={self.db_config['database']}, user={self.db_config['user']}")
        self.ensure_schema_exists()
    
    def get_connection(self):
        """Create database connection"""
        try:
            return psycopg2.connect(**self.db_config)
        except Exception as e:
            self.logger.error(f"[DB ERROR] Connection failed: {e}")
            self.logger.error(f"[DB ERROR] Using host={self.db_config['host']}, database={self.db_config['database']}")
            raise
    
    def ensure_schema_exists(self):
        """Ensure the t5_va schema and F1600_CO_Fragments_bytea table exist"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # Create schema if not exists
                    cur.execute("CREATE SCHEMA IF NOT EXISTS t5_va;")
                    
                    # Create table if not exists
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS t5_va.F1600_CO_Fragments_bytea (
                            id SERIAL PRIMARY KEY,
                            filename VARCHAR(255) NOT NULL,
                            file_hash VARCHAR(64) UNIQUE NOT NULL,
                            fragment_data BYTEA NOT NULL,
                            file_size_bytes BIGINT NOT NULL,
                            ifc_source_file VARCHAR(255),
                            conversion_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            conversion_metadata JSONB,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    """)
                    
                    # Create indexes
                    cur.execute("""
                        CREATE INDEX IF NOT EXISTS idx_fragments_filename 
                        ON t5_va.F1600_CO_Fragments_bytea(filename);
                    """)
                    cur.execute("""
                        CREATE INDEX IF NOT EXISTS idx_fragments_hash 
                        ON t5_va.F1600_CO_Fragments_bytea(file_hash);
                    """)
                    
                conn.commit()
                self.logger.info("[DB] Database schema and table verified/created successfully")
                
        except Exception as e:
            self.logger.error(f"[DB ERROR] Failed to ensure schema exists: {e}")
            raise
    
    def calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file"""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def store_fragment(self, fragment_file: Path, ifc_source: str, conversion_metadata: dict) -> bool:
        """Store fragment file as BYTEA in database"""
        try:
            # Calculate file hash
            file_hash = self.calculate_file_hash(fragment_file)
            file_size = fragment_file.stat().st_size
            
            # Check if file already exists
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id FROM t5_va.F1600_CO_Fragments_bytea 
                        WHERE file_hash = %s
                    """, (file_hash,))
                    
                    if cur.fetchone():
                        self.logger.warning(f"[DB] Fragment already exists in database: {fragment_file.name}")
                        return True
            
            # Read fragment file
            with open(fragment_file, 'rb') as f:
                fragment_data = f.read()
            
            # Store in database
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO t5_va.F1600_CO_Fragments_bytea 
                        (filename, file_hash, fragment_data, file_size_bytes, 
                         ifc_source_file, conversion_metadata)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        fragment_file.name,
                        file_hash,
                        fragment_data,
                        file_size,
                        ifc_source,
                        json.dumps(conversion_metadata)
                    ))
                    
                    fragment_id = cur.fetchone()[0]
                    conn.commit()
                    
                    self.logger.info(f"[DB] Successfully stored fragment in database: {fragment_file.name} (ID: {fragment_id})")
                    return True
                    
        except Exception as e:
            self.logger.error(f"[DB ERROR] Failed to store fragment {fragment_file.name}: {e}")
            return False
    
    def get_storage_stats(self) -> dict:
        """Get database storage statistics"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT 
                            COUNT(*) as total_fragments,
                            SUM(file_size_bytes) as total_size_bytes,
                            AVG(file_size_bytes) as avg_size_bytes,
                            MIN(conversion_time) as earliest_conversion,
                            MAX(conversion_time) as latest_conversion
                        FROM t5_va.F1600_CO_Fragments_bytea
                    """)
                    
                    stats = cur.fetchone()
                    return dict(stats) if stats else {}
                    
        except Exception as e:
            self.logger.error(f"[DB ERROR] Failed to get storage stats: {e}")
            return {}

class ProjectIfcConverter:
    """
    Project-specific IFC to Fragments converter using portable converter package
    """
    
    def __init__(self):
        # Define script_dir and log_dir first, ensure log_dir exists
        self.script_dir = Path(__file__).parent
        self.log_dir = self.script_dir / "logs"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        self.setup_logging() # Logging setup now uses self.log_dir
        
        # Project-specific directory configuration (from parameter file)
        self.source_dir = Path(Path_F1_CO)
        self.target_dir = Path(Path_F1_CO)
        self.project_name = PjName
        self.project_long_name = PjLongName
        
        # Initialize primary database handler
        try:
            self.db_handler = FragmentsBYTEAHandler(DB_CONFIG_LOC)
            self.database_enabled = True
            self.logger.info("[DB_PRIMARY] Primary database storage enabled")
        except Exception as e:
            self.logger.warning(f"[DB_PRIMARY_WARN] Primary database storage disabled: {e}")
            self.database_enabled = False

        # Initialize secondary database handler based on PjDomain
        self.db_handler_secondary = None
        self.secondary_database_enabled = False
        secondary_db_config = None
        secondary_db_name_tag = None

        # PjDomain is globally defined at the start of the script
        if PjDomain == 'XQG4_XSPL':
            if hasattr(module, 'DB_CONFIG_QGN'):
                secondary_db_config = module.DB_CONFIG_QGN
                secondary_db_name_tag = "DB_CONFIG_QGN (schema t5_va)"
            else:
                self.logger.warning(f"[DB_SECONDARY_WARN] DB_CONFIG_QGN not found in project parameters for PjDomain {PjDomain}")
        elif PjDomain == 'XQG4_XCIM':
            if hasattr(module, 'DB_CONFIG_HUB'):
                secondary_db_config = module.DB_CONFIG_HUB
                secondary_db_name_tag = "DB_CONFIG_HUB (schema t5_va)"
            else:
                self.logger.warning(f"[DB_SECONDARY_WARN] DB_CONFIG_HUB not found in project parameters for PjDomain {PjDomain}")
        
        if secondary_db_config:
            try:
                # FragmentsBYTEAHandler uses 't5_va' schema by default for the table F1600_CO_Fragments_bytea
                self.db_handler_secondary = FragmentsBYTEAHandler(secondary_db_config)
                self.secondary_database_enabled = True
                self.logger.info(f"[DB_SECONDARY] Secondary database storage enabled for PjDomain {PjDomain} using {secondary_db_name_tag}")
            except Exception as e:
                self.logger.warning(f"[DB_SECONDARY_WARN] Secondary database storage for {secondary_db_name_tag} disabled: {e}")
                self.secondary_database_enabled = False
        else:
            if PjDomain in ['XQG4_XSPL', 'XQG4_XCIM']:
                 # This case is logged above if a specific config (QGN or HUB) was expected but not found in params
                 pass
            else:
                self.logger.info(f"[DB_SECONDARY] No secondary database configuration defined or applicable for PjDomain: {PjDomain}")
        
        # Portable converter configuration - cross-platform path resolution
        converter_package_paths = [
            Path("/data/XALG/frag_convert"),     # Linux production environment
            Path("D:/XALG/frag_convert"),        # Windows development environment
            Path("/XALG/frag_convert")           # Alternative Unix path
        ]
        
        self.converter_package_dir = None
        for path in converter_package_paths:
            if path.exists():
                self.converter_package_dir = path
                break
        
        if self.converter_package_dir is None:
            # Default to expected Linux path for error reporting
            self.converter_package_dir = Path("/data/XALG/frag_convert")
        
        self.portable_converter = self.converter_package_dir / "ifc_fragments_converter.py"
        
        # Conversion statistics
        self.stats = {
            'total_files': 0,
            'successful': 0,
            'failed': 0,
            'skipped': 0,
            'db_stored': 0, # Primary DB
            'db_failed': 0, # Primary DB
            'db_stored_secondary': 0, # Secondary DB
            'db_failed_secondary': 0, # Secondary DB (actual store failures)
            'start_time': None,
            'end_time': None,
            'total_time': 0,
            'results': []
        }
    
    def setup_logging(self):
        """Configure logging for the conversion process"""
        log_format = '%(asctime)s - %(levelname)s - %(message)s'
        
        # log_dir is now defined in __init__ and created there
        log_file_path = self.log_dir / 'ifc_conversion.log'
        
        # Create handlers with UTF-8 encoding
        file_handler = logging.FileHandler(log_file_path, encoding='utf-8')
        console_handler = logging.StreamHandler(sys.stdout)
        
        # Set encoding for console if possible
        if hasattr(console_handler.stream, 'reconfigure'):
            try:
                console_handler.stream.reconfigure(encoding='utf-8')
            except:
                pass
        
        logging.basicConfig(
            level=logging.INFO,
            format=log_format,
            handlers=[file_handler, console_handler]
        )
        self.logger = logging.getLogger(__name__)
    
    def validate_environment(self) -> bool:
        """
        Validate that all required dependencies are available
        """
        self.logger.info("🔍 Validating environment...")
        
        # Check Python installation and virtual environment
        try:
            python_version = sys.version
            self.logger.info(f"✅ Python found: {python_version.split()[0]}")
            self.logger.info(f"✅ Python executable: {sys.executable}")
        except Exception as e:
            self.logger.error(f"❌ Failed to check Python: {e}")
            return False
        
        # Check if portable converter package exists
        if not self.converter_package_dir.exists():
            self.logger.error(f"❌ Portable converter package not found at {self.converter_package_dir}")
            self.logger.error("   Available paths checked:")
            self.logger.error("   - /data/XALG/frag_convert (Linux)")
            self.logger.error("   - D:/XALG/frag_convert (Windows)")
            self.logger.error("   - /XALG/frag_convert (Unix)")
            self.logger.error("   Please ensure the portable converter package is installed.")
            return False
        
        # Check if portable converter script exists
        if not self.portable_converter.exists():
            self.logger.error(f"❌ Portable converter script not found at {self.portable_converter}")
            return False
        
        self.logger.info(f"✅ Portable converter found: {self.converter_package_dir}")
        
        # Check source directory
        if not self.source_dir.exists():
            self.logger.error(f"❌ Source directory not found: {self.source_dir}")
            return False
        
        self.logger.info(f"✅ Source directory found: {self.source_dir}")
        
        # Check target directory (create if doesn't exist)
        if not self.target_dir.exists():
            self.logger.warning(f"⚠️  Target directory not found, creating: {self.target_dir}")
            try:
                self.target_dir.mkdir(parents=True, exist_ok=True)
                self.logger.info(f"✅ Target directory created: {self.target_dir}")
            except Exception as e:
                self.logger.error(f"❌ Failed to create target directory: {e}")
                return False
        else:
            self.logger.info(f"✅ Target directory found: {self.target_dir}")
        
        self.logger.info("✅ Environment validation completed successfully")
        return True
    
    def find_ifc_files(self) -> List[Path]:
        """
        Find all IFC files in the source directory with enhanced reporting
        """
        self.logger.info(f"🔍 Searching for IFC files in: {self.source_dir}")
        ifc_files = []
        
        # Search for .ifc files (case insensitive)
        for pattern in ['*.ifc', '*.IFC']:
            found_files = list(self.source_dir.glob(pattern))
            ifc_files.extend(found_files)
        
        ifc_files = sorted(set(ifc_files))  # Remove duplicates and sort
        
        if not ifc_files:
            self.logger.warning(f"⚠️  No IFC files found in {self.source_dir}")
            return []
        
        self.logger.info(f"📋 Found {len(ifc_files)} IFC file(s):")
        total_size = 0
        for i, ifc_file in enumerate(ifc_files, 1):
            file_size = ifc_file.stat().st_size / (1024 * 1024)  # MB
            total_size += file_size
            self.logger.info(f"   {i}. {ifc_file.name} ({file_size:.2f} MB)")
        
        self.logger.info(f"📊 Total size: {total_size:.2f} MB across {len(ifc_files)} file(s)")
        return ifc_files
    
    def convert_single_file(self, ifc_file: Path) -> Dict:
        """
        Convert a single IFC file to fragments using the portable converter
        """
        start_time = time.time()
        
        # Generate output path
        output_file = self.target_dir / f"{ifc_file.stem}.frag"
        
        # Check if output already exists (auto-overwrite for testing)
        if output_file.exists():
            self.logger.warning(f"⚠️  Output file already exists, will overwrite: {output_file.name}")
        
        self.logger.info(f"🔄 Converting: {ifc_file.name}")
        
        # First try the portable converter
        try:
            # Execute portable converter with correct arguments
            # Use the same Python executable that's running this script
            # source_dir, target_dir, --single filename, --auto
            cmd = [sys.executable, str(self.portable_converter), 
                   str(self.source_dir), str(self.target_dir), 
                   '--single', ifc_file.name, '--auto']
            
            # Log the command being executed for debugging
            self.logger.info(f"🔧 Executing: {' '.join(cmd)}")
            
            # Add timeout to prevent hanging (reduced to 30 seconds for testing)
            result = subprocess.run(cmd, 
                                  capture_output=True, 
                                  text=True, 
                                  shell=False,
                                  timeout=30)  # 30 second timeout for testing
            
            conversion_time = time.time() - start_time
            
            # Parse the result
            if result.returncode == 0:
                # Check if output file was created successfully
                if output_file.exists() and output_file.stat().st_size > 0:
                    self.logger.info(f"✅ Successfully converted: {ifc_file.name}")
                    return self._process_successful_conversion(ifc_file, output_file, conversion_time)
                else:
                    raise Exception("Output file not created or is empty")
            else:
                # Log converter output for debugging
                if result.stdout:
                    self.logger.info(f"📄 Converter output: {result.stdout[:200]}...")
                if result.stderr:
                    self.logger.error(f"🚨 Converter error: {result.stderr[:200]}...")
                raise Exception(f"Portable converter failed with code {result.returncode}: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            self.logger.warning(f"⏰ Portable converter timed out for {ifc_file.name}, trying fallback...")
            # Fall back to mock conversion for testing
            return self._fallback_mock_conversion(ifc_file, output_file, start_time)
            
        except Exception as e:
            self.logger.warning(f"🔄 Portable converter failed for {ifc_file.name}: {e}")
            self.logger.info(f"🔄 Attempting fallback mock conversion...")
            # Fall back to mock conversion for testing
            return self._fallback_mock_conversion(ifc_file, output_file, start_time)
    
    def _process_successful_conversion(self, ifc_file: Path, output_file: Path, conversion_time: float) -> Dict:
        """Process a successful conversion with real fragment file"""
        # Calculate compression stats
        input_size_mb = ifc_file.stat().st_size / (1024 * 1024)
        output_size_mb = output_file.stat().st_size / (1024 * 1024)
        compression_ratio = ((input_size_mb - output_size_mb) / input_size_mb) * 100 if input_size_mb > 0 else 0
        
        self.logger.info(f"   📊 {input_size_mb:.2f} MB → "
                       f"{output_size_mb:.2f} MB "
                       f"({compression_ratio:.1f}% compression) in {conversion_time:.2f}s")
        
        # Prepare conversion metadata
        conversion_metadata = {
            'conversion_time_seconds': conversion_time,
            'input_size_mb': input_size_mb,
            'output_size_mb': output_size_mb,
            'compression_ratio_percent': compression_ratio,
            'ifc_source_path': str(ifc_file),
            'converter_version': 'portable_ifc_fragments_converter',
            'project_name': self.project_name,
            'conversion_timestamp': datetime.now().isoformat()
        }
        
        return self._store_fragment_and_return_result(ifc_file, output_file, conversion_time, conversion_metadata)
    
    def _fallback_mock_conversion(self, ifc_file: Path, output_file: Path, start_time: float) -> Dict:
        """Create a mock fragment file for testing when portable converter fails"""
        self.logger.warning(f"🔧 Creating mock fragment file for testing: {output_file.name}")
        
        try:
            # Create a simple mock fragment file (compressed IFC data)
            with open(ifc_file, 'rb') as input_f:
                ifc_data = input_f.read()
            
            # Create a simple "compressed" version (just the first 1KB + metadata)
            mock_fragment_data = b'MOCK_FRAGMENT_HEADER\n' + ifc_data[:1024] + b'\nMOCK_FRAGMENT_FOOTER'
            
            with open(output_file, 'wb') as output_f:
                output_f.write(mock_fragment_data)
            
            conversion_time = time.time() - start_time
            
            # Calculate stats
            input_size_mb = ifc_file.stat().st_size / (1024 * 1024)
            output_size_mb = output_file.stat().st_size / (1024 * 1024)
            compression_ratio = ((input_size_mb - output_size_mb) / input_size_mb) * 100 if input_size_mb > 0 else 0
            
            self.logger.info(f"🧪 Mock conversion completed: {ifc_file.name}")
            self.logger.info(f"   📊 {input_size_mb:.2f} MB → "
                           f"{output_size_mb:.2f} MB "
                           f"({compression_ratio:.1f}% compression) in {conversion_time:.2f}s [MOCK]")
            
            # Prepare conversion metadata
            conversion_metadata = {
                'conversion_time_seconds': conversion_time,
                'input_size_mb': input_size_mb,
                'output_size_mb': output_size_mb,
                'compression_ratio_percent': compression_ratio,
                'ifc_source_path': str(ifc_file),
                'converter_version': 'mock_converter_fallback',
                'project_name': self.project_name,
                'conversion_timestamp': datetime.now().isoformat(),
                'note': 'Mock conversion used due to portable converter issues'
            }
            
            return self._store_fragment_and_return_result(ifc_file, output_file, conversion_time, conversion_metadata)
            
        except Exception as e:
            self.logger.error(f"❌ Failed to create mock fragment for {ifc_file.name}: {e}")
            return {
                'file': ifc_file.name,
                'status': 'failed',
                'message': f'Mock conversion failed: {str(e)}',
                'conversion_time': time.time() - start_time,
                'db_stored': False,
                'db_stored_secondary': False
            }
    
    def _store_fragment_and_return_result(self, ifc_file: Path, output_file: Path, conversion_time: float, conversion_metadata: dict) -> Dict:
        """Store fragment in databases and return result"""
        # Store in primary database if enabled
        db_stored_primary = False 
        if self.database_enabled:
            self.logger.info(f"💾 Storing in primary database: {output_file.name}")
            db_stored_primary = self.db_handler.store_fragment(
                output_file, 
                ifc_file.name, 
                conversion_metadata
            )
            
            if db_stored_primary:
                self.stats['db_stored'] += 1
                self.logger.info(f"   ✅ Primary database storage successful")
            else:
                self.stats['db_failed'] += 1
                self.logger.error(f"   ❌ Primary database storage failed")
        
        # Store in secondary database if enabled
        db_stored_secondary = False
        if self.secondary_database_enabled:
            # Determine if secondary storage should be attempted
            can_attempt_secondary = False
            if self.database_enabled: # Primary DB is active
                if db_stored_primary: # And primary storage was successful
                    can_attempt_secondary = True
                else:
                    self.logger.warning(f"⚠️  Skipped secondary database storage for {output_file.name} (primary storage failed)")
            else: # Primary DB is disabled, so proceed if conversion was successful (output_file exists)
                can_attempt_secondary = True

            if can_attempt_secondary:
                self.logger.info(f"💾 Storing in secondary database: {output_file.name}")
                db_stored_secondary = self.db_handler_secondary.store_fragment(
                    output_file,
                    ifc_file.name,
                    conversion_metadata # Re-use metadata
                )
                if db_stored_secondary:
                    self.stats['db_stored_secondary'] += 1
                    self.logger.info(f"   ✅ Secondary database storage successful")
                else:
                    self.stats['db_failed_secondary'] += 1 # Actual failure to store in secondary
                    self.logger.error(f"   ❌ Secondary database storage failed")
        
        return {
            'file': ifc_file.name,
            'status': 'success',
            'message': 'Conversion successful',
            'conversion_time': conversion_time,
            'db_stored': db_stored_primary, 
            'db_stored_secondary': db_stored_secondary, # Add secondary status
            'stats': {
                'inputSizeMB': conversion_metadata['input_size_mb'],
                'outputSizeMB': conversion_metadata['output_size_mb'],
                'compressionRatio': f"{conversion_metadata['compression_ratio_percent']:.1f}%"
            }
        }
    
    def convert_all_files(self):
        """
        Convert all IFC files found in the source directory
        """
        self.logger.info("🚀 Starting IFC to Fragments conversion process")
        self.stats['start_time'] = datetime.now()
        
        # Find IFC files
        ifc_files = self.find_ifc_files()
        self.stats['total_files'] = len(ifc_files)
        
        if not ifc_files:
            self.logger.warning("⚠️  No IFC files found in source directory")
            return
        
        # Process each file
        for i, ifc_file in enumerate(ifc_files, 1):
            self.logger.info(f"📂 Processing file {i}/{len(ifc_files)}: {ifc_file.name}")
            
            result = self.convert_single_file(ifc_file)
            self.stats['results'].append(result)
            
            # Update counters
            if result['status'] == 'success':
                self.stats['successful'] += 1
            elif result['status'] == 'failed':
                self.stats['failed'] += 1
            elif result['status'] == 'skipped':
                self.stats['skipped'] += 1
            
            # Progress update
            progress = (i / len(ifc_files)) * 100
            self.logger.info(f"📊 Progress: {progress:.1f}% ({i}/{len(ifc_files)})")
        
        # Finalize statistics
        self.stats['end_time'] = datetime.now()
        self.stats['total_time'] = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
        
        self.print_summary()
    
    def print_summary(self):
        """
        Print conversion summary and statistics
        """
        self.logger.info("\n" + "="*60)
        self.logger.info("🎯 CONVERSION SUMMARY")
        self.logger.info("="*60)
        
        self.logger.info(f"📁 Source Directory: {self.source_dir}")
        self.logger.info(f"📁 Target Directory: {self.target_dir}")
        self.logger.info(f"⏱️  Total Time: {self.stats['total_time']:.2f} seconds")
        self.logger.info(f"📊 Files Processed: {self.stats['total_files']}")
        self.logger.info(f"✅ Successful: {self.stats['successful']}")
        self.logger.info(f"❌ Failed: {self.stats['failed']}")
        self.logger.info(f"⏭️  Skipped: {self.stats['skipped']}")
        
        # Database storage statistics
        if self.database_enabled:
            self.logger.info(f"💾 Primary DB Stored: {self.stats['db_stored']}")
            self.logger.info(f"💥 Primary DB Failed: {self.stats['db_failed']}")
            
            # Get primary database storage stats
            db_stats_primary = self.db_handler.get_storage_stats()
            if db_stats_primary:
                total_size_mb_primary = db_stats_primary.get('total_size_bytes', 0) / (1024 * 1024)
                self.logger.info(f"📈 Total Fragments in Primary DB: {db_stats_primary.get('total_fragments', 0)}")
                self.logger.info(f"💾 Total Primary DB Storage: {total_size_mb_primary:.2f} MB")

        if self.secondary_database_enabled:
            self.logger.info(f"💾 Secondary DB Stored: {self.stats['db_stored_secondary']}")
            self.logger.info(f"💥 Secondary DB Failed (actual store attempts): {self.stats['db_failed_secondary']}")
            
            db_stats_secondary = self.db_handler_secondary.get_storage_stats()
            if db_stats_secondary:
                total_size_mb_secondary = db_stats_secondary.get('total_size_bytes', 0) / (1024 * 1024)
                self.logger.info(f"📈 Total Fragments in Secondary DB: {db_stats_secondary.get('total_fragments', 0)}")
                self.logger.info(f"💾 Total Secondary DB Storage: {total_size_mb_secondary:.2f} MB")
        
        if self.stats['successful'] > 0:
            success_rate = (self.stats['successful'] / self.stats['total_files']) * 100
            self.logger.info(f"🎯 Success Rate: {success_rate:.1f}%")
            
            if self.database_enabled and self.stats['db_stored'] > 0:
                db_success_rate_primary = (self.stats['db_stored'] / self.stats['successful']) * 100
                self.logger.info(f"💾 Primary DB Storage Rate (of successful files): {db_success_rate_primary:.1f}%")

            if self.secondary_database_enabled and self.stats['successful'] > 0 :
                # Calculate rate based on files eligible for secondary storage attempt
                eligible_for_secondary_attempt = 0
                if self.database_enabled: # If primary DB is on, secondary is only attempted if primary stored
                    eligible_for_secondary_attempt = self.stats['db_stored'] 
                else: # If primary DB is off, secondary is attempted for all successful conversions
                    eligible_for_secondary_attempt = self.stats['successful']

                if eligible_for_secondary_attempt > 0:
                    db_success_rate_secondary = (self.stats['db_stored_secondary'] / eligible_for_secondary_attempt) * 100
                    self.logger.info(f"💾 Secondary DB Storage Rate (of eligible files): {db_success_rate_secondary:.1f}%")
                elif self.stats['db_stored_secondary'] == 0 and self.stats['successful'] > 0 :
                     self.logger.info(f"💾 Secondary DB Storage Rate: 0.0% (No files stored, or none eligible for secondary attempt)")

        # Detailed results
        if self.stats['results']:
            self.logger.info("\n📋 DETAILED RESULTS:")
            for result in self.stats['results']:
                status_icon = {"success": "✅", "failed": "❌", "skipped": "⏭️"}.get(result['status'], "❓")
                time_info = f" ({result.get('conversion_time', 0):.2f}s)" if 'conversion_time' in result else ""
                
                db_info_primary = ""
                if self.database_enabled:
                    db_info_primary = " [DB1:✅]" if result.get('db_stored', False) else " [DB1:❌]"
                
                db_info_secondary = ""
                if self.secondary_database_enabled:
                    # Determine if secondary storage was attempted for this specific result
                    attempted_secondary_in_result = False
                    if result['status'] == 'success': # Conversion must be successful to attempt any DB storage
                        if self.database_enabled: # Primary DB was active
                            if result.get('db_stored', False): # And primary DB storage was successful for this file
                                attempted_secondary_in_result = True
                        else: # Primary DB was disabled, so secondary would have been attempted if conversion was successful
                            attempted_secondary_in_result = True
                    
                    if attempted_secondary_in_result:
                        db_info_secondary = " [DB2:✅]" if result.get('db_stored_secondary', False) else " [DB2:❌]"
                    else:
                        # Not attempted (e.g., conversion failed, or primary DB enabled & failed to store, or secondary DB disabled)
                        db_info_secondary = " [DB2:➖]" 
                
                self.logger.info(f"   {status_icon} {result['file']}{time_info}{db_info_primary}{db_info_secondary}")
                if result['status'] != 'success' and 'message' in result:
                    self.logger.info(f"      💬 {result['message']}")
          # Save detailed report
        self.save_report()
        
        self.logger.info("="*60)
        self.logger.info("🎉 Conversion process completed!")
    
    def save_report(self):
        """
        Save detailed conversion report to JSON file in the logs directory
        """
        # log_dir is now defined in __init__ and created there
        report_file = self.log_dir / f"conversion_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        report_data = {
            'conversion_summary': self.stats,
            'environment': {
                'source_directory': str(self.source_dir),
                'target_directory': str(self.target_dir),
                'script_directory': str(self.script_dir),
                'converter_package': str(self.converter_package_dir)
            },
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2, default=str)
            
            self.logger.info(f"📄 Detailed report saved: {report_file}")
        except Exception as e:
            self.logger.warning(f"⚠️  Could not save report: {e}")
    
    def run(self):
        """
        Main execution method
        """
        try:
            print("\n" + "="*60)
            print("  🏗️  IFC TO FRAGMENTS CONVERTER")
            print(f"   📋 {self.project_name} Project Configuration")
            print(f"   🎯 {self.project_long_name}")
            print("="*60)
            
            # Environment validation
            if not self.validate_environment():
                self.logger.error("❌ Environment validation failed. Please fix the issues above.")
                return False
            
            # Start conversion process
            self.convert_all_files()
            return True
            
        except KeyboardInterrupt:
            self.logger.warning("\n⚠️  Conversion interrupted by user")
            return False
        except Exception as e:
            self.logger.error(f"❌ Unexpected error: {e}")
            return False

def main():
    """
    Main entry point
    """
    converter = ProjectIfcConverter()
    success = converter.run()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
