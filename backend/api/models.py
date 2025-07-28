from django.db import models
from django.contrib.auth.models import User

class Task(models.Model):
    """
    Represents a task assigned to a user.

    Attributes:
        title (CharField): The title of the task, limited to 100 characters.
        description (TextField): Optional detailed description of the task.
        created_at (DateTimeField): Timestamp when the task was created.
        user (ForeignKey): Reference to the User who owns the task.

    Methods:
        __str__(): Returns the title of the task as its string representation.
    """
    title = models.CharField(max_length=100)
    content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # updated_at = models.DateTimeField(auto_now=True)
    # due_date = models.DateTimeField(blank=True, null=True)
    # completed = models.BooleanField(default=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')

    def __str__(self):
        return self.title
