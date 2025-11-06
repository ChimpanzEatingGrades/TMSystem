from django.urls import path
from . import views

urlpatterns = [
    # Task management endpoints
    path("tasks/", views.TaskListCreate.as_view(), name="task-list"),
    path("tasks/<int:pk>/", views.TaskDetailUpdateDelete.as_view(), name="task-detail-update-delete"),
    path("tasks/<int:pk>/delete/", views.TaskDelete.as_view(), name="task-delete"),

    # User registration and info
    path("register/", views.CreateUserView.as_view(), name="user-register"),
    path("user/", views.current_user, name="current-user"),
]
