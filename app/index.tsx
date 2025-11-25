// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // Redirige automáticamente al grupo auth/login
  return <Redirect href="/(main)/exercises" />;
  // return <Redirect href="/(auth)/login" />;
}
