# app.py
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')

# Routes
@app.route('/')
def index():
    return jsonify({
                'status': 'success',
                'message': "Hello there!"
            }), 200

if __name__ == '__main__':
    app.run(debug=True)