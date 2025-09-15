from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Task

class UserSerializer(serializers.ModelSerializer):

    """
    UserSerializer is a Django REST Framework serializer for the User model.

    - Fields:
        - id: The unique identifier for the user.
        - username: The user's username.
        - password: The user's password (write-only for security).

    - Meta options:
        - extra_kwargs: Ensures the password field is write-only, so it won't be exposed in API responses.

    - Methods:
        - create(validated_data): Overrides the default create method to use Django's create_user method,
          which handles password hashing and user creation securely.

    This serializer is typically used for user registration and management in APIs, ensuring that sensitive
    information like passwords is handled securely and not exposed in API responses.
    """
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password"]
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {"required": True},
             
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class TaskSerializer(serializers.ModelSerializer):
    """
    TaskSerializer is a Django REST Framework serializer for the Task model.

    - Fields:
        - id: The unique identifier for the task.
        - title: The title of the task.
        - description: A detailed description of the task.
        - completed: A boolean indicating whether the task is completed.
        - created_at: The timestamp when the task was created.
        - updated_at: The timestamp when the task was last updated.

    This serializer is used to convert Task model instances into JSON format and vice versa,
    allowing for easy data exchange in APIs.
    """
    class Meta:
        model = Task
        fields = ["id", "title", "content", "created_at", "author"]
        extra_kwargs = {"author": {"read_only": True}}  # Include all fields from the Task model