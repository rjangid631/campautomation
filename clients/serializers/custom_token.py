from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['login_type'] = user.login_type
        token['name'] = user.name
        token['email'] = user.email

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['login_type'] = self.user.login_type
        data['name'] = self.user.name
        data['user_id'] = self.user.id
        return data
