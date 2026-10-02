from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import os
from flask_cors import CORS

from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)


from functools import wraps



load_dotenv()

app = Flask(__name__)
CORS(app)
# JWT Authentication
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY",
    "change-this-secret-key"
)

jwt = JWTManager(app)
def admin_required():
    def decorator(function):
        @wraps(function)
        @jwt_required()
        def wrapper(*args, **kwargs):

            current_user_id = int(get_jwt_identity())

            user = User.query.get(current_user_id)

            if not user:
                return jsonify({
                    "status": "error",
                    "message": "User not found"
                }), 404

            if not user.is_admin:
                return jsonify({
                    "status": "error",
                    "message": "Admin access required"
                }), 403

            return function(*args, **kwargs)

        return wrapper

    return decorator

# PostgreSQL database connection

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# =========================
# USER MODEL
# =========================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

    is_admin = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    def __repr__(self):
        return f"<User {self.username}>"

class Profile(db.Model):
    __tablename__ = "profiles"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    full_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    profile_photo = db.Column(db.Text, nullable=True)


class Like(db.Model):
    __tablename__ = "likes"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    liked_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

class Match(db.Model):
    __tablename__ = "matches"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    matched_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )


class PhotoLike(db.Model):
    __tablename__ = "photo_likes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )
    photo_id = db.Column(
        db.Integer,
        db.ForeignKey("photos.id"),
        nullable=False
    )
    created_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp()
    )



class Photo(db.Model):
    __tablename__ = "photos"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )
    photo_url = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp()
    )



class PhotoComment(db.Model):
    __tablename__ = "photo_comments"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    photo_id = db.Column(
        db.Integer,
        db.ForeignKey("photos.id"),
        nullable=False
    )

    comment = db.Column(
        db.Text,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp()
    )




class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    sender_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True
    )

    type = db.Column(
        db.String(50),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    photo_id = db.Column(
        db.Integer,
        db.ForeignKey("photos.id", ondelete="CASCADE"),
        nullable=True
    )

    is_read = db.Column(
        db.Boolean,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp()
    )



class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    sender_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    receiver_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    is_read = db.Column(
        db.Boolean,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp()
    )




# =========================
# PHOTO ROUTES
# =========================
@app.route("/api/admin/users", methods=["GET"])
@admin_required()
def get_admin_users():

    users = User.query.order_by(
        User.id.desc()
    ).all()

    return jsonify({
        "status": "success",
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin,
                "photo_count": Photo.query.filter_by(
                    user_id=user.id
                ).count()
            }
            for user in users
        ]
    }), 200

@app.route("/api/admin/photos", methods=["GET"])
@admin_required()
def get_admin_photos():

    photos = Photo.query.order_by(
        Photo.created_at.desc()
    ).all()

    return jsonify({
        "status": "success",
        "photos": [
            {
                "id": photo.id,
                "photo_url": photo.photo_url,
                "user_id": photo.user_id,
                "username": User.query.get(photo.user_id).username
                if User.query.get(photo.user_id)
                else "Unknown",
                "email": User.query.get(photo.user_id).email
                if User.query.get(photo.user_id)
                else "Unknown",
                "created_at": photo.created_at
            }
            for photo in photos
        ]
    }), 200



@app.route("/api/photos/<int:user_id>", methods=["GET"])
def get_photos(user_id):
    current_user_id = request.args.get(
        "current_user_id",
        type=int
    )

    photos = Photo.query.filter_by(user_id=user_id).all()

    return jsonify({
        "status": "success",
        "count": len(photos),
        "photos": [
            {
                "id": photo.id,
                "user_id": photo.user_id,
                "photo_url": photo.photo_url,

                "likes": PhotoLike.query.filter_by(
                    photo_id=photo.id
                ).count(),

                "liked_by_current_user": (
                    PhotoLike.query.filter_by(
                        user_id=current_user_id,
                        photo_id=photo.id
                    ).first()
                    is not None
                ) if current_user_id else False,

                "created_at": photo.created_at
            }
            for photo in photos
        ]
    }), 200


@app.route(
    "/api/photo-unlike",
    methods=["DELETE", "OPTIONS"]
)
def unlike_photo():

    if request.method == "OPTIONS":
        return jsonify({
            "status": "success"
        }), 200

    data = request.get_json()

    user_id = data.get("user_id")
    photo_id = data.get("photo_id")

    if not user_id or not photo_id:
        return jsonify({
            "status": "error",
            "message": "User ID and photo ID are required"
        }), 400

    like = PhotoLike.query.filter_by(
        user_id=user_id,
        photo_id=photo_id
    ).first()

    if not like:
        return jsonify({
            "status": "error",
            "message": "You have not liked this photo"
        }), 404

    db.session.delete(like)
    db.session.commit()

    like_count = PhotoLike.query.filter_by(
        photo_id=photo_id
    ).count()

    return jsonify({
        "status": "success",
        "message": "Photo unliked",
        "photo_id": photo_id,
        "likes": like_count
    }), 200





@app.route("/api/photo-comment", methods=["POST"])
def add_photo_comment():
    data = request.get_json()

    user_id = data.get("user_id")
    photo_id = data.get("photo_id")
    comment = data.get("comment")

    if not user_id or not photo_id or not comment:
        return jsonify({
            "status": "error",
            "message": "User ID, photo ID and comment are required"
        }), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    photo = Photo.query.get(photo_id)

    if not photo:
        return jsonify({
            "status": "error",
            "message": "Photo not found"
        }), 404

    new_comment = PhotoComment(
        user_id=user_id,
        photo_id=photo_id,
        comment=comment.strip()
    )

    
    db.session.add(new_comment)

    # Create notification for the photo owner
    if photo.user_id != user_id:
      notification = Notification(
        user_id=photo.user_id,
        sender_id=user_id,
        type="photo_comment",
        message=new_comment.comment,
        photo_id=photo_id
    )

    db.session.add(notification)

    db.session.commit()



    return jsonify({
        "status": "success",
        "message": "Comment added ❤️",
        "comment": {
            "id": new_comment.id,
            "user_id": new_comment.user_id,
            "photo_id": new_comment.photo_id,
            "comment": new_comment.comment,
            "created_at": new_comment.created_at
        }
    }), 201


@app.route("/api/photo-comments/<int:photo_id>", methods=["GET"])
def get_photo_comments(photo_id):
    photo = Photo.query.get(photo_id)

    if not photo:
        return jsonify({
            "status": "error",
            "message": "Photo not found"
        }), 404

    comments = PhotoComment.query.filter_by(
        photo_id=photo_id
    ).order_by(
        PhotoComment.created_at.asc()
    ).all()

    return jsonify({
        "status": "success",
        "count": len(comments),
        "comments": [
            {
                "id": comment.id,
                "user_id": comment.user_id,
                "photo_id": comment.photo_id,
                "comment": comment.comment,
                "created_at": comment.created_at
            }
            for comment in comments
        ]
    }), 200






@app.route("/api/photos", methods=["POST"])
def add_photo():
    data = request.get_json()

    user_id = data.get("user_id")
    photo_url = data.get("photo_url")

    if not user_id or not photo_url:
        return jsonify({
            "status": "error",
            "message": "User ID and photo URL are required"
        }), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    new_photo = Photo(
        user_id=user_id,
        photo_url=photo_url
    )

    db.session.add(new_photo)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Photo added successfully ❤️",
        "photo": {
            "id": new_photo.id,
            "user_id": new_photo.user_id,
            "photo_url": new_photo.photo_url,
            "created_at": new_photo.created_at
        }
    }), 201


@app.route("/api/photos/<int:photo_id>", methods=["DELETE"])
def delete_photo(photo_id):
    photo = Photo.query.get(photo_id)

    if not photo:
        return jsonify({
            "status": "error",
            "message": "Photo not found"
        }), 404

    db.session.delete(photo)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Photo deleted successfully"
    }), 200


# ==============================
# NOTIFICATION ROUTES
# ==============================

@app.route("/api/notifications/<int:user_id>", methods=["GET"])
@jwt_required()
def get_notifications(user_id):

    current_user_id = int(get_jwt_identity())

    if current_user_id != user_id:
        return jsonify({
            "status": "error",
            "message": "Unauthorized"
        }), 403

    notifications = Notification.query.filter_by(
        user_id=user_id
    ).order_by(
        Notification.created_at.desc()
    ).all()

    return jsonify({
        "status": "success",
        "count": len(notifications),
        
        "notifications": [
     {
            "id": notification.id,
            "user_id": notification.user_id,
            "sender_id": notification.sender_id,
             "sender_name": (
                Profile.query.filter_by(
                user_id=notification.sender_id
            ).first().full_name
            if notification.sender_id
            and Profile.query.filter_by(
                user_id=notification.sender_id
            ).first()
            else "Someone"
        ),
        "sender_photo": (
            Profile.query.filter_by(
                user_id=notification.sender_id
            ).first().profile_photo
            if notification.sender_id
            and Profile.query.filter_by(
                user_id=notification.sender_id
            ).first()
            else None
        ),
        "type": notification.type,
        "message": notification.message,
        "photo_id": notification.photo_id,
        "is_read": notification.is_read,
        "created_at": notification.created_at
    }
    for notification in notifications
]


    }), 200


@app.route("/api/notifications/<int:user_id>/unread-count", methods=["GET"])
@jwt_required()
def get_unread_notification_count(user_id):
    current_user_id = int(get_jwt_identity())

    if current_user_id != user_id:
        return jsonify({
            "status": "error",
            "message": "Unauthorized"
        }), 403


    unread_count = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()

    return jsonify({
        "status": "success",
        "unread_count": unread_count
    }), 200


@app.route("/api/notifications/<int:notification_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notification_id):

    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({
            "status": "error",
            "message": "Notification not found"
        }), 404

    if notification.user_id != current_user_id:
        return jsonify({
            "status": "error",
            "message": "Unauthorized"
        }), 403
    current_user_id = int(get_jwt_identity())

    if not notification:
        return jsonify({
            "status": "error",
            "message": "Notification not found"
        }), 404

    notification.is_read = True

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Notification marked as read"
    }), 200


@app.route("/api/notifications/<int:user_id>/read-all", methods=["PUT"])
@jwt_required()
def mark_all_notifications_read(user_id):

    current_user_id = int(get_jwt_identity())

    if current_user_id != user_id:
        return jsonify({
            "status": "error",
            "message": "Unauthorized"
        }), 403

    notifications = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).all()

    for notification in notifications:
        notification.is_read = True

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "All notifications marked as read",
        "updated": len(notifications)
    }), 200


@app.route(
    "/api/notifications/<int:notification_id>",
    methods=["DELETE"]
)
def delete_notification(notification_id):

    notification = Notification.query.get(notification_id)

    if not notification:
        return jsonify({
            "status": "error",
            "message": "Notification not found"
        }), 404

    db.session.delete(notification)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Notification deleted"
    }), 200




@app.route("/api/health")
def health():
    return jsonify({
        "status": "success",
        "message": "Love Connect backend is running ❤️"
    })


@app.route("/api/database-test")
def database_test():
    try:
        db.session.execute(db.text("SELECT 1"))

        return jsonify({
            "status": "success",
            "message": "Flask is connected to PostgreSQL ❤️"
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    # Check required fields
    if not username or not email or not password:
        return jsonify({
            "status": "error",
            "message": "Username, email and password are required"
        }), 400

    # Check if username already exists
    existing_username = User.query.filter_by(username=username).first()

    if existing_username:
        return jsonify({
            "status": "error",
            "message": "Username already exists"
        }), 409

    # Check if email already exists
    existing_email = User.query.filter_by(email=email).first()

    if existing_email:
        return jsonify({
            "status": "error",
            "message": "Email already exists"
        }), 409

    # Hash password
    hashed_password = generate_password_hash(password)

    # Create user
    new_user = User(
        username=username,
        email=email,
        password=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Account created successfully ❤️",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email
        }
    }), 201

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            "status": "error",
            "message": "Invalid email or password"
        }), 401

    if not check_password_hash(user.password, password):
        return jsonify({
            "status": "error",
            "message": "Invalid email or password"
        }), 401

    # Create JWT token
    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "status": "success",
        "message": "Login successful ❤️",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin
        }
    }), 200

@app.route("/api/profile/<int:user_id>", methods=["GET"])
@jwt_required()
def get_profile(user_id):

    # Make sure the requested user actually exists
    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    profile = Profile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({
            "status": "error",
            "message": "Profile not found"
        }), 404

    return jsonify({
        "status": "success",
        "profile": {
            "id": profile.id,
            "user_id": profile.user_id,
            "full_name": profile.full_name,
            "age": profile.age,
            "gender": profile.gender,
            "location": profile.location,
            "bio": profile.bio,
            "profile_photo": profile.profile_photo
        }
    }), 200


@app.route("/api/profile/<int:user_id>", methods=["PUT"])
def update_profile(user_id):
    data = request.get_json()

    profile = Profile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({
            "status": "error",
            "message": "Profile not found"
        }), 404

    if "full_name" in data:
        profile.full_name = data["full_name"]

    if "age" in data:
        profile.age = data["age"]

    if "gender" in data:
        profile.gender = data["gender"]

    if "location" in data:
        profile.location = data["location"]

    if "bio" in data:
        profile.bio = data["bio"]

    if "profile_photo" in data:
        profile.profile_photo = data["profile_photo"]

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Profile updated successfully ❤️",
        "profile": {
            "id": profile.id,
            "user_id": profile.user_id,
            "full_name": profile.full_name,
            "age": profile.age,
            "gender": profile.gender,
            "location": profile.location,
            "bio": profile.bio,
            "profile_photo": profile.profile_photo
        }
    }), 200

# =========================
# GET ALL USER PROFILES
# =========================

@app.route("/api/users", methods=["GET"])
def get_users():
    profiles = Profile.query.all()

    users = []

    for profile in profiles:
        users.append({
            "id": profile.id,
            "user_id": profile.user_id,
            "full_name": profile.full_name,
            "age": profile.age,
            "gender": profile.gender,
            "location": profile.location,
            "bio": profile.bio,
            "profile_photo": profile.profile_photo
        })

    return jsonify({
        "status": "success",
        "count": len(users),
        "users": users
    }), 200

# =========================
# LIKE A USER
# =========================

@app.route("/api/like", methods=["DELETE"])
@jwt_required()
def unlike_user():
    data = request.get_json()

    user_id = data.get("user_id")
    liked_user_id = data.get("liked_user_id")

    if not user_id or not liked_user_id:
        return jsonify({
            "status": "error",
            "message": "User ID and liked user ID are required"
        }), 400

    current_user_id = int(get_jwt_identity())

    # Make sure the token owner is the person removing the like
    if current_user_id != user_id:
        return jsonify({
            "status": "error",
            "message": "Unauthorized"
        }), 403

    like = Like.query.filter_by(
        user_id=user_id,
        liked_user_id=liked_user_id
    ).first()

    if not like:
        return jsonify({
            "status": "error",
            "message": "Like not found"
        }), 404

    db.session.delete(like)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Like removed successfully"
    }), 200

@app.route("/api/like", methods=["POST"])
@jwt_required()
def like_user():
    data = request.get_json()

    user_id = data.get("user_id")
    liked_user_id = data.get("liked_user_id")

    if not user_id or not liked_user_id:
        return jsonify({
            "status": "error",
            "message": "User ID and liked user ID are required"
        }), 400

    current_user_id = int(get_jwt_identity())

    # Make sure the JWT owner is the person creating the like
    if current_user_id != user_id:
        return jsonify({
            "status": "error",
            "message": "Unauthorized"
        }), 403

    if user_id == liked_user_id:
        return jsonify({
            "status": "error",
            "message": "You cannot like yourself"
        }), 400

    user = User.query.get(user_id)
    liked_user = User.query.get(liked_user_id)

    if not user or not liked_user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    existing_like = Like.query.filter_by(
        user_id=user_id,
        liked_user_id=liked_user_id
    ).first()

    reverse_like = Like.query.filter_by(
        user_id=liked_user_id,
        liked_user_id=user_id
    ).first()

    # Both users have liked each other
    if existing_like and reverse_like:

        existing_match = Match.query.filter(
            (
                (Match.user_id == user_id) &
                (Match.matched_user_id == liked_user_id)
            ) |
            (
                (Match.user_id == liked_user_id) &
                (Match.matched_user_id == user_id)
            )
        ).first()

        if existing_match:
            return jsonify({
                "status": "success",
                "message": "You are already matched ❤️💕",
                "match": {
                    "id": existing_match.id,
                    "user_id": existing_match.user_id,
                    "matched_user_id": existing_match.matched_user_id
                }
            }), 200

        # Create new match
        new_match = Match(
            user_id=user_id,
            matched_user_id=liked_user_id
        )

        db.session.add(new_match)

        # Create notification for the user who was liked
        notification = Notification(
            user_id=liked_user_id,
            sender_id=user_id,
            type="match",
            message="You have a new match! ❤️💕"
        )

        db.session.add(notification)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "It's a match! ❤️💕",
            "match": {
                "id": new_match.id,
                "user_id": new_match.user_id,
                "matched_user_id": new_match.matched_user_id
            }
        }), 201

    # User already liked this person
    if existing_like:
        return jsonify({
            "status": "error",
            "message": "You already liked this user"
        }), 409

    # Create new like
    new_like = Like(
        user_id=user_id,
        liked_user_id=liked_user_id
    )

    db.session.add(new_like)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "User liked successfully ❤️",
        "like": {
            "id": new_like.id,
            "user_id": new_like.user_id,
            "liked_user_id": new_like.liked_user_id
        }
    }), 201

@app.route("/api/matches/<int:user_id>", methods=["GET"])
def get_matches(user_id):
    matches = Match.query.filter(
        (Match.user_id == user_id) |
        (Match.matched_user_id == user_id)
    ).all()

    result = []

    for match in matches:
        if match.user_id == user_id:
            other_user_id = match.matched_user_id
        else:
            other_user_id = match.user_id

        other_user = User.query.get(other_user_id)
        profile = Profile.query.filter_by(user_id=other_user_id).first()

        result.append({
            "match_id": match.id,
            "user_id": other_user_id,
            "username": other_user.username if other_user else None,
            "full_name": profile.full_name if profile else None,
            "age": profile.age if profile else None,
            "gender": profile.gender if profile else None,
            "location": profile.location if profile else None,
            "bio": profile.bio if profile else None,
            "profile_photo": profile.profile_photo if profile else None
        })

    return jsonify({
        "status": "success",
        "count": len(result),
        "matches": result
    }), 200

    data = request.get_json()

    user_id = data.get("user_id")
    liked_user_id = data.get("liked_user_id")

    if not user_id or not liked_user_id:
        return jsonify({
            "status": "error",
            "message": "User ID and liked user ID are required"
        }), 400

    if user_id == liked_user_id:
        return jsonify({
            "status": "error",
            "message": "You cannot like yourself"
        }), 400

    user = User.query.get(user_id)
    liked_user = User.query.get(liked_user_id)

    if not user or not liked_user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    existing_like = Like.query.filter_by(
        user_id=user_id,
        liked_user_id=liked_user_id
    ).first()

    if existing_like:
        return jsonify({
            "status": "error",
            "message": "You already liked this user"
        }), 409

    new_like = Like(
        user_id=user_id,
        liked_user_id=liked_user_id
    )

    db.session.add(new_like)

    # Check if the other user already liked this user
    reverse_like = Like.query.filter_by(
        user_id=liked_user_id,
        liked_user_id=user_id
    ).first()

    if reverse_like:
        new_match = Match(
            user_id=user_id,
            matched_user_id=liked_user_id
        )

        db.session.add(new_match)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "It's a match! ❤️💕",
            "match": {
                "id": new_match.id,
                "user_id": new_match.user_id,
                "matched_user_id": new_match.matched_user_id
            }
        }), 201

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "User liked successfully ❤️",
        "like": {
            "id": new_like.id,
            "user_id": new_like.user_id,
            "liked_user_id": new_like.liked_user_id
        }
    }), 201

    # =========================





# CREATE PROFILE
# =========================


@app.route("/api/profile", methods=["POST"])
def create_or_update_profile():
    data = request.get_json()

    user_id = data.get("user_id")
    full_name = data.get("full_name")
    age = data.get("age")
    gender = data.get("gender")
    location = data.get("location")
    bio = data.get("bio")
    profile_photo = data.get("profile_photo")

    if not user_id:
        return jsonify({
            "status": "error",
            "message": "User ID is required"
        }), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    # Check whether the user already has a profile
    profile = Profile.query.filter_by(user_id=user_id).first()

    if profile:
        # Update existing profile
        profile.full_name = full_name
        profile.age = age
        profile.gender = gender
        profile.location = location
        profile.bio = bio

        if profile_photo:
            profile.profile_photo = profile_photo

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Profile updated successfully ❤️",
            "profile": {
                "id": profile.id,
                "user_id": profile.user_id,
                "full_name": profile.full_name,
                "age": profile.age,
                "gender": profile.gender,
                "location": profile.location,
                "bio": profile.bio,
                "profile_photo": profile.profile_photo
            }
        }), 200

    # Create new profile
    new_profile = Profile(
        user_id=user_id,
        full_name=full_name,
        age=age,
        gender=gender,
        location=location,
        bio=bio,
        profile_photo=profile_photo
    )

    db.session.add(new_profile)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Profile created successfully ❤️",
        "profile": {
            "id": new_profile.id,
            "user_id": new_profile.user_id,
            "full_name": new_profile.full_name,
            "age": new_profile.age,
            "gender": new_profile.gender,
            "location": new_profile.location,
            "bio": new_profile.bio,
            "profile_photo": new_profile.profile_photo
        }
    }), 201


@app.route("/api/conversations/<int:user_id>", methods=["GET"])
@jwt_required()
def get_conversations(user_id):

    current_user_id = int(get_jwt_identity())

    if current_user_id != user_id:
        return jsonify({
            "status": "error",
            "message": "Unauthorized"
        }), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    # Get all messages involving this user
    messages = Message.query.filter(
        (Message.sender_id == user_id) |
        (Message.receiver_id == user_id)
    ).order_by(
        Message.created_at.desc()
    ).all()

    conversations = {}

    for message in messages:

        # Find the other person
        if message.sender_id == user_id:
            other_user_id = message.receiver_id
        else:
            other_user_id = message.sender_id

        # Only keep the latest message for each conversation
        if other_user_id not in conversations:

            other_user = User.query.get(other_user_id)

            if not other_user:
                continue

            # Check that the two users are matched
            existing_match = Match.query.filter(
                (
                    (Match.user_id == user_id) &
                    (Match.matched_user_id == other_user_id)
                )
                |
                (
                    (Match.user_id == other_user_id) &
                    (Match.matched_user_id == user_id)
                )
            ).first()

            # Don't show conversations with non-matches
            if not existing_match:
                continue

            profile = Profile.query.filter_by(
                user_id=other_user_id
            ).first()

            # Count ONLY unread messages from this person
            unread_count = Message.query.filter_by(
                sender_id=other_user_id,
                receiver_id=user_id,
                is_read=False
            ).count()

            conversations[other_user_id] = {
                "user_id": other_user_id,
                "username": other_user.username,
                "full_name": (
                    profile.full_name
                    if profile
                    else other_user.username
                ),
                "profile_photo": (
                    profile.profile_photo
                    if profile
                    else None
                ),
                "last_message": message.message,
                "last_message_time": message.created_at,
                "last_message_sender_id": message.sender_id,
                "unread_count": unread_count
            }

    return jsonify({
        "status": "success",
        "count": len(conversations),
        "conversations": list(conversations.values())
    }), 200
#=============================================================================================================
#MESSAGE
#==========================================================================================================

@app.route("/api/messages/<int:user_id>/unread-count", methods=["GET"])
def get_unread_message_count(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    unread_count = Message.query.filter_by(
        receiver_id=user_id,
        is_read=False
    ).count()

    return jsonify({
        "status": "success",
        "unread_count": unread_count
    }), 200

@app.route("/api/messages/<int:user_id>/<int:other_user_id>/read", methods=["PUT"])
@jwt_required()
def mark_messages_as_read(user_id, other_user_id):

    current_user_id = int(get_jwt_identity())

    if current_user_id != user_id:
        return jsonify({
            "status": "error",
            "message": "Unauthorized"
        }), 403

    user = User.query.get(user_id)
    other_user = User.query.get(other_user_id)

    if not user or not other_user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    # Check whether the two users are matched
    existing_match = Match.query.filter(
        (
            (Match.user_id == user_id) &
            (Match.matched_user_id == other_user_id)
        )
        |
        (
            (Match.user_id == other_user_id) &
            (Match.matched_user_id == user_id)
        )
    ).first()

    if not existing_match:
        return jsonify({
            "status": "error",
            "message": "You can only mark messages from a matched user as read ❤️"
        }), 403

    # Mark only messages FROM the other user TO the current user as read
    Message.query.filter_by(
        sender_id=other_user_id,
        receiver_id=user_id,
        is_read=False
    ).update({
        "is_read": True
    })

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Messages marked as read"
    }), 200


@app.route("/api/messages", methods=["POST"])
@jwt_required()
def send_message():
    data = request.get_json()

    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    message_text = data.get("message")

    current_user_id = int(get_jwt_identity())

    if current_user_id != sender_id:
        return jsonify({
            "status": "error",
            "message": "Unauthorized"
        }), 403

    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    message_text = data.get("message")

    if not sender_id or not receiver_id or not message_text:
        return jsonify({
            "status": "error",
            "message": "Sender, receiver and message are required"
        }), 400

    if sender_id == receiver_id:
        return jsonify({
            "status": "error",
            "message": "You cannot send a message to yourself"
        }), 400

    sender = User.query.get(sender_id)
    receiver = User.query.get(receiver_id)

    if not sender or not receiver:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    # Check whether the two users are matched
    existing_match = Match.query.filter(
        (
            (Match.user_id == sender_id) &
            (Match.matched_user_id == receiver_id)
        )
        |
        (
            (Match.user_id == receiver_id) &
            (Match.matched_user_id == sender_id)
        )
    ).first()

    if not existing_match:
        return jsonify({
            "status": "error",
            "message": "You can only message someone you have matched with ❤️"
        }), 403

    message_text = message_text.strip()

    if not message_text:
        return jsonify({
            "status": "error",
            "message": "Message cannot be empty"
        }), 400

    new_message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        message=message_text
    )

    db.session.add(new_message)

    # Create notification for the receiver
    notification = Notification(
        user_id=receiver_id,
        sender_id=sender_id,
        type="message",
        message="You received a new message 💬"
    )

    db.session.add(notification)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Message sent successfully",
        "data": {
            "id": new_message.id,
            "sender_id": new_message.sender_id,
            "receiver_id": new_message.receiver_id,
            "message": new_message.message,
            "is_read": new_message.is_read,
            "created_at": new_message.created_at
        }
    }), 201



    # Check that both users exist
    user = User.query.get(user_id)
    other_user = User.query.get(other_user_id)

    if not user or not other_user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    # Get messages exchanged between the two users
    messages = Message.query.filter(
        (
            (Message.sender_id == user_id) &
            (Message.receiver_id == other_user_id)
        )
        |
        (
            (Message.sender_id == other_user_id) &
            (Message.receiver_id == user_id)
        )
    ).order_by(
        Message.created_at.asc()
    ).all()

    return jsonify({
        "status": "success",
        "count": len(messages),
        "messages": [
            {
                "id": message.id,
                "sender_id": message.sender_id,
                "receiver_id": message.receiver_id,
                "message": message.message,
                "is_read": message.is_read,
                "created_at": message.created_at
            }
            for message in messages
        ]
    }), 200



@app.route("/api/messages/<int:user_id>/<int:other_user_id>", methods=["GET"])
@jwt_required()
def get_messages(user_id, other_user_id):

    current_user_id = int(get_jwt_identity())

    if current_user_id != user_id:
        return jsonify({
            "status": "error",
            "message": "Unauthorized"
        }), 403

    user = User.query.get(user_id)
    other_user = User.query.get(other_user_id)

    if not user or not other_user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    # Check whether the two users are matched
    existing_match = Match.query.filter(
        (
            (Match.user_id == user_id) &
            (Match.matched_user_id == other_user_id)
        )
        |
        (
            (Match.user_id == other_user_id) &
            (Match.matched_user_id == user_id)
        )
    ).first()

    if not existing_match:
        return jsonify({
            "status": "error",
            "message": "You can only view messages with someone you have matched with ❤️"
        }), 403

    messages = Message.query.filter(
        (
            (Message.sender_id == user_id) &
            (Message.receiver_id == other_user_id)
        )
        |
        (
            (Message.sender_id == other_user_id) &
            (Message.receiver_id == user_id)
        )
    ).order_by(
        Message.created_at.asc()
    ).all()

    return jsonify({
        "status": "success",
        "count": len(messages),
        "messages": [
            {
                "id": message.id,
                "sender_id": message.sender_id,
                "receiver_id": message.receiver_id,
                "message": message.message,
                "is_read": message.is_read,
                "created_at": message.created_at
            }
            for message in messages
        ]
    }), 200


# =========================
# CREATE DATABASE TABLES
# =========================

with app.app_context():
    print("TABLES:", db.metadata.tables.keys())
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)