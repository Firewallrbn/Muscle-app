import { AuthContext } from "@/Context/AuthContext";
import { useRouter } from "expo-router";
import { useContext, useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const context = useContext(AuthContext);
  const router = useRouter();

  const handleLogin = async () => {
    const cleanEmail = email.trim();
      const cleanPassword = password.trim();
    const success = await context.login(cleanEmail, cleanPassword);
    if (success) {
        router.replace("/(main)/exercises");
        console.log("Login exitoso");
    } else {
      alert("Error al iniciar sesión. Revisa tus credenciales.");
      console.log("No sirve");
      
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MUSCLE</Text>
      <Image source={require('../../assets/images/Coco.png')} style={styles.Logo} />
      <Text style={styles.descrition}>Aplicacion para hacer ejercicio</Text>
      <Text style={styles.text}>Usuario</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Usuario"/>
      <Text style={styles.text}>Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />

      <TouchableOpacity style={styles.buttonlogin} onPress={handleLogin}>
        <Text style={styles.text}>Iniciar sesion</Text>
      </TouchableOpacity>

      <Text style={styles.descrition}>¿No tienes cuenta? Registrate</Text>
      <TouchableOpacity style={styles.buttonlogin}>
        <Text style={styles.text} onPress={() => router.push("/(auth)/register")}>Registrate</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5f6',
     alignItems: "center",
  },
  blacktext:{
    color: 'black',
    fontSize: 20
  },
  buttonlogin:{
    backgroundColor: '#FC3058',
    color: 'white',
    padding: 10,
    borderRadius: 10,
    width: '50%',
    alignItems: "center"
  }
  ,
  text:{
    fontSize: 20,
    justifyContent: "flex-start",
    color: 'black'
  },
  descrition:{
    fontSize: 15,
    fontStyle: "italic",
    color: 'black',
    marginTop: 20
  },
  Logo:{
    width: 100,
    height: 100,
    margin: 20
  },
  title:{
    fontSize: 40,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 20,
    color: '#FC3058'
  },
  input:{
    borderColor: 'gray',
    color: 'black',
    borderWidth: 1,
    width: '80%',
    height: 40,
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderBlockColor: 'blue'
  }
})