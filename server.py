from flask import Flask, render_template, request, abort, jsonify
from flask_marshmallow import Marshmallow
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Init flask
app = Flask(__name__)
# Init database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydb.db'

# create database
db = SQLAlchemy(app)
# Serialize objects and models: marshmallow
ma = Marshmallow(app)


# Marshmallow schemas can be used to:
#   - Validate input data.
#   - Deserialize input data to app-level objects.
#   - Serialize app-level objects to primitive Python types.
#     The serialized objects can then be rendered to standard formats such as JSON for use in an HTTP API.

# Create model to store all elements of the layouts
class LayoutModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    content = db.Column(db.PickleType)
    picture = db.Column(db.String)
    date_created = db.Column(db.DateTime, default=datetime.utcnow())

    def __init__(self, title, content, picture, date_created):
        self.title = title
        self.content = content
        self.picture = picture
        self.date_created = date_created


class LayoutSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = LayoutModel


# create database
db.create_all()
single_layout_schema = LayoutSchema()
all_books_schema = LayoutSchema(many=True)


# Use the route() decorator to bind a function to a URL.
# By default, a route only answers to GET requests
@app.route('/', methods=['POST', 'GET'])
@app.route('/home', methods=['POST', 'GET'])
def index():
    # Post method
    if request.method == 'POST':
        print('Posting')
        if not request.json or not 'title' in request.json:
            print("Error")
            abort(404)
        title = request.json['title']
        content = request.json['content']
        picture = request.json['picture']

        new_layout = LayoutModel(title=title, content=content, picture=picture,
                                 date_created=datetime.utcnow())

        try:
            db.session.add(new_layout)
            db.session.commit()
            return jsonify({'id': new_layout.id,
                            'title': title,
                            'content': content}), 201

        except:
            print("error")
            return jsonify({'Test': 'Failed'}), 404
    else:
        return render_template("index.html")


@app.route('/stored')
def stored():
    return render_template("stored.html")


@app.route('/stored/get')
# Get all layouts stored
def get_layouts():
    if request.method == 'GET':
        layouts = LayoutModel.query.all()
        return jsonify(all_books_schema.dump(layouts)), 200


@app.route('/stored/<int:id>', methods=['GET', 'DELETE', 'PUT'])
def get_layout(id):
    # Get specific layout
    if request.method == 'GET':
        layout = LayoutModel.query.get_or_404(id)
        return single_layout_schema.jsonify(layout)
    # Delete specific layout
    elif request.method == 'DELETE':
        layout_to_delete = LayoutModel.query.get_or_404(id)
        try:
            db.session.delete(layout_to_delete)
            db.session.commit()

            return jsonify({'Test': 'Successful'}), 200
        except:
            return jsonify({'Test': 'Failed'}), 404
    # Update specific layout
    elif request.method == 'PUT':
        layout = LayoutModel.query.get_or_404(id)

        layout.title = request.json['title']
        try:
            db.session.commit()
            return jsonify({'Test': 'Successful'}), 200
        except:
            return jsonify({'Test': 'Failed'}), 404


@app.route('/stored/delete', methods=['DELETE'])
# Delete entire database
def delete_db():
    db.drop_all()
    db.create_all()

    return jsonify({'Test': 'Successful'}), 200


if __name__ == '__main__':
    app.run(debug=True)
