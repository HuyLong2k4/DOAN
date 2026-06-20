import { Stack } from 'expo-router';

export default function StackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="REWARD/leaderboard" />
      <Stack.Screen name="REWARD/rewards" />
      <Stack.Screen name="SETTINGS/settings" />
      <Stack.Screen name="HELP/help" />
      <Stack.Screen name="DONOR/home" />
      <Stack.Screen name="DONOR/donate" />
      <Stack.Screen name="DONOR/historyDonation" />
      <Stack.Screen name="DONOR/donationDetail" />
      <Stack.Screen name="RECEIVER/home" />
      <Stack.Screen name="RECEIVER/donorList" />
      <Stack.Screen name="RECEIVER/donationDetail" />
      <Stack.Screen name="RECEIVER/request" />
      <Stack.Screen name="RECEIVER/addPickup" />
      <Stack.Screen name="RECEIVER/tracking" />
      <Stack.Screen name="RECEIVER/feedback" />
      <Stack.Screen name="VOLUNTEER/historyDelivery" />
      <Stack.Screen name="VOLUNTEER/deliveryDetail" />
      <Stack.Screen name="VOLUNTEER/requestDetail" />
      <Stack.Screen name="chat/[conversationId]" />
    </Stack>
  );
}
