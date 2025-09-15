from rest_framework import viewsets
from .models import RawMaterial
from .serializers import RawMaterialSerializer
from rest_framework.permissions import IsAuthenticated

class RawMaterialViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing, creating, updating, and deleting raw materials.
    """
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer
    permission_classes = [IsAuthenticated]  