import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="forgotPassword" />
      <Stack.Screen name="resetPassword" />
      <Stack.Screen name="selectRole" />
      <Stack.Screen name="donorDetails" />
      <Stack.Screen name="receiverDetails" />
      <Stack.Screen name="volunteerDetails" />
      <Stack.Screen name="confirmation" />
    </Stack>
  );
}
