import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FC3058",
        tabBarInactiveTintColor: "#8C8B91",
        tabBarStyle: {
          backgroundColor: "#1C1C1E",
          borderTopColor: "transparent",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Routines",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "barbell" : "barbell-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="muscle"
        options={{
          title: "Muscle",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "flame" : "flame-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="exercises"
        options={{
          title: "Exercises",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "fitness" : "fitness-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="max"
        options={{
          title: "M.A.X",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
