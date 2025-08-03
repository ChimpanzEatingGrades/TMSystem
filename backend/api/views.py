from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, TaskSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Task



# Create your views here.

class TaskListCreate(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]  # Ensure the user is authenticated to access this view

    def get_queryset(self):
        user = self.request.user        
        return Task.objects.filter(author=user)

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)

class TaskDetailUpdateDelete(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(author=self.request.user)
    

#redundant, but kept for clarity    
class TaskDelete(generics.DestroyAPIView):
    """
    API endpoint that allows deletion of a task.
    
    This view provides a DELETE method to remove a specific task by its ID.
    Accessible only to authenticated users.
    
    API view to delete a task.
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]  # Ensure the user is authenticated to access this view

    def get_queryset(self):
        user = self.request.user        
        return Task.objects.filter(author=user)

class CreateUserView(generics.CreateAPIView):
    """
    API endpoint that allows creation of a new user.

    This view provides a POST method for user registration. It uses the specified serializer to validate and save user data.
    Accessible to any user (no authentication required).
    
    API view to create a new user.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Allow any user to create a new user