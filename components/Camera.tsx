import { supabase } from '@/utils/Supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { ActivityIndicator, Button, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Machine {
  id: string;
  name: string;
  muscles: string;
  instructions: string;
  image_url: string | null;
}

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [machineData, setMachineData] = useState<Machine | null>(null);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const isValidMachineCode = (data: string): boolean => {
    const regex = /^machine_\d+$/;
    return regex.test(data);
  };

  const fetchMachineData = async (machineId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('id, name, muscles, instructions, image_url')
        .eq('id', machineId)
        .single();

      if (error || !data) {
        setErrorMessage('Código QR inválido');
        setMachineData(null);
      } else {
        setMachineData(data);
        setErrorMessage('');
      }
    } catch (err) {
      console.error('Error fetching machine:', err);
      setErrorMessage('Código QR inválido');
      setMachineData(null);
    } finally {
      setIsLoading(false);
      // Cerrar la cámara ANTES de mostrar el modal
      setIsScanning(false);
      // Mostrar el modal DESPUÉS de cerrar la cámara
      setTimeout(() => {
        setShowMachineModal(true);
      }, 100);
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    if (!isValidMachineCode(data)) {
      setErrorMessage('Código QR inválido');
      setMachineData(null);
      setIsScanning(false);
      setTimeout(() => {
        setShowMachineModal(true);
      }, 100);
      return;
    }

    fetchMachineData(data);
  };

  const closeMachineModal = () => {
    setShowMachineModal(false);
    setMachineData(null);
    setErrorMessage('');
    setScanned(false);
  };

  const continueScanningFromModal = () => {
    setShowMachineModal(false);
    setMachineData(null);
    setErrorMessage('');
    setScanned(false);
    // Reabrir la cámara
    setTimeout(() => {
      setIsScanning(true);
    }, 100);
  };

  const closeScanningModal = () => {
    setIsScanning(false);
    setScanned(false);
  };

  if (!isScanning) {
    return (
      <>
        <View style={styles.buttonContainerStatic}>
          <TouchableOpacity style={styles.scanButton} onPress={() => setIsScanning(true)}>
            <Text style={styles.scanButtonText}>📷 Escanear QR</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de máquina - FUERA del modal de cámara */}
        <Modal visible={showMachineModal} animationType="fade" transparent onRequestClose={closeMachineModal}>
          <View style={styles.modalOverlay}>
            {isLoading ? (
              <View style={styles.modalContent}>
                <ActivityIndicator size="large" color="#FC3058" />
                <Text style={styles.modalText}>Cargando información...</Text>
              </View>
            ) : errorMessage ? (
              <View style={styles.modalContent}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={continueScanningFromModal}>
                    <Text style={styles.secondaryButtonText}>Seguir Escaneando</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={closeMachineModal}>
                    <Text style={styles.primaryButtonText}>Volver</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : machineData ? (
              <View style={styles.modalContent}>
                <Text style={styles.machineTitle}>{machineData.name}</Text>

                {machineData.image_url && (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Imagen de la máquina</Text>
                  </View>
                )}

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Grupos Musculares:</Text>
                  <Text style={styles.infoValue}>{machineData.muscles}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Instrucciones:</Text>
                  <Text style={styles.infoValue}>{machineData.instructions}</Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={continueScanningFromModal}>
                    <Text style={styles.secondaryButtonText}>Seguir Escaneando</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={closeMachineModal}>
                    <Text style={styles.primaryButtonText}>Volver</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </Modal>
      </>
    );
  }

  return (
    <Modal visible={isScanning} animationType="slide" onRequestClose={closeScanningModal}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_e', 'code128'],
          }}
        />
        
        {/* Overlay con scanArea */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Botón de cerrar */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={closeScanningModal}>
            <Text style={styles.text}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FC3058',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 64,
    justifyContent: 'flex-end',
  },
  button: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonContainerStatic: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  scanButton: {
    backgroundColor: '#FC3058',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Modal de máquina */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  machineTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 14,
  },
  infoSection: {
    width: '100%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    color: '#222',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FC3058',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 16,
    color: '#c00',
    fontWeight: '600',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});