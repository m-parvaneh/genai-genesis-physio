# app.py
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Sample model
class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Item {self.title}>'

# Routes
@app.route('/')
def index():
    items = Item.query.order_by(Item.created_at.desc()).all()
    return render_template('index.html', items=items)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/item/<int:item_id>')
def item_detail(item_id):
    item = Item.query.get_or_404(item_id)
    return render_template('item_detail.html', item=item)

@app.route('/item/new', methods=['GET', 'POST'])
def new_item():
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        
        if not title:
            flash('Title is required', 'error')
            return redirect(url_for('new_item'))
        
        item = Item(title=title, description=description)
        db.session.add(item)
        db.session.commit()
        
        flash('Item created successfully', 'success')
        return redirect(url_for('index'))
    
    return render_template('new_item.html')

@app.route('/item/<int:item_id>/edit', methods=['GET', 'POST'])
def edit_item(item_id):
    item = Item.query.get_or_404(item_id)
    
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        
        if not title:
            flash('Title is required', 'error')
            return redirect(url_for('edit_item', item_id=item.id))
        
        item.title = title
        item.description = description
        db.session.commit()
        
        flash('Item updated successfully', 'success')
        return redirect(url_for('item_detail', item_id=item.id))
    
    return render_template('edit_item.html', item=item)

@app.route('/item/<int:item_id>/delete', methods=['POST'])
def delete_item(item_id):
    item = Item.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    
    flash('Item deleted successfully', 'success')
    return redirect(url_for('index'))

# API routes example
@app.route('/api/items', methods=['GET'])
def api_get_items():
    items = Item.query.order_by(Item.created_at.desc()).all()
    items_data = [
        {
            'id': item.id,
            'title': item.title,
            'description': item.description,
            'created_at': item.created_at.isoformat()
        } for item in items
    ]
    return jsonify(items_data)

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

# Create database tables
def init_db():
    with app.app_context():
        db.create_all()
        
        # Add sample data if the database is empty
        if Item.query.count() == 0:
            sample_items = [
                Item(title='First Item', description='This is your first item.'),
                Item(title='Second Item', description='This is another sample item.')
            ]
            db.session.add_all(sample_items)
            db.session.commit()

if __name__ == '__main__':
    init_db()
    app.run(debug=True)