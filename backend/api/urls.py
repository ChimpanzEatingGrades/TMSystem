from django.urls import path
from . import views

urlpatterns = [
    path("tasks/", views.TaskListCreate.as_view(), name="task-list"),
    path("tasks/<int:pk>/", views.TaskDetailUpdateDelete.as_view(), name="task-detail-update-delete"),
]