from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .serializers import UserSerializer, TaskSerializer
from .models import Task
from django.contrib.auth import authenticate


# ==============================
# TASK VIEWS
# ==============================

class TaskListCreate(generics.ListCreateAPIView):
    """
    API endpoint that allows users to list or create their own tasks.
    Only authenticated users can access this.
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only show tasks belonging to the authenticated user
        user = self.request.user
        return Task.objects.filter(author=user)

    def perform_create(self, serializer):
        # Automatically assign the authenticated user as the author
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)


class TaskDetailUpdateDelete(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to retrieve, update, or delete a single task.
    Only the task's author can perform these actions.
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(author=self.request.user)


class TaskDelete(generics.DestroyAPIView):
    """
    API endpoint that allows deletion of a task by ID.
    Only authenticated users can delete their own tasks.
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(author=user)


# ==============================
# USER AUTH / INFO VIEWS
# ==============================

class CreateUserView(generics.CreateAPIView):
    """
    API endpoint to create a new user (registration).
    Accessible to anyone without authentication.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    API endpoint to get details of the currently authenticated user.
    Returns username, is_superuser flag, and group memberships.
    Used by the frontend ProtectedRoute to determine role access.
    """
    user = request.user
    data = {
        "username": user.username,
        "is_superuser": user.is_superuser,
        "groups": list(user.groups.values_list("name", flat=True)),
    }
    return Response(data, status=status.HTTP_200_OK)


class VerifyAdminCredentialsView(APIView):
    """
    An endpoint to verify the credentials of a user and check if they
    belong to the 'manager' group or are a superuser.
    """
    permission_classes = [IsAuthenticated] # Requires a user to be logged in to use it

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({"error": "Username and password are required."}, status=400)

        # Authenticate the provided credentials
        user = authenticate(username=username, password=password)

        if user is not None:
            # Check if the user is a superuser or in the 'manager' group
            is_manager = user.groups.filter(name__iexact='manager').exists()
            if user.is_superuser or is_manager:
                return Response({"authorized": True}, status=200)
            else:
                return Response({"error": "Insufficient permissions. Manager access required."}, status=403)
        else:
            return Response({"error": "Invalid credentials provided."}, status=401)
