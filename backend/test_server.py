#!/usr/bin/env python3
"""
Minimal test Flask server to diagnose connectivity issues
"""

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Server is running"})

@app.route('/api/test-subprocess', methods=['GET'])
def test_subprocess():
    print("🔥 TEST SUBPROCESS ENDPOINT HIT!")
    return jsonify({"message": "Subprocess endpoint working!"})

if __name__ == '__main__':
    print("🚀 Starting minimal test Flask server...")
    print("🌐 Server running on http://127.0.0.1:8111")
    
    app.run(host='127.0.0.1', port=8111, debug=False)
