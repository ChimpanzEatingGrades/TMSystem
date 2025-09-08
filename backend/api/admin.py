# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils.html import format_html

User = get_user_model()

class CustomUserAdmin(UserAdmin):
    def save_model(self, request, obj, form, change):
        if obj.pk == request.user.pk:  # editing yourself
            if not obj.is_active:
                raise ValidationError("You cannot deactivate your own account.")
            if not obj.is_superuser:
                raise ValidationError("You cannot remove your own superuser status.")
            if not obj.is_staff:
                raise ValidationError("You cannot remove your own staff status.")
        super().save_model(request, obj, form, change)

    def has_delete_permission(self, request, obj=None):
        if obj and obj.pk == request.user.pk:
            return False  # can't delete yourself
        return super().has_delete_permission(request, obj)

    def profile_link(self, obj):
        return format_html(
            '<a href="http://localhost:5173/" target="_blank">Click here</a>'
        )
    profile_link.short_description = "Go back to home"

    # Extend UserAdmin.list_display instead of BaseUserAdmin
    list_display = UserAdmin.list_display + ("profile_link",)


# Unregister the default UserAdmin and register the custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
