import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Camera() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [scanned, setScanned] = useState(false);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        alert(`Bar code with type ${type} and data ${data} has been scanned!`);
        setIsScanning(false); // Close modal after scan
        setScanned(false); // Reset scanned state for next time
    };

    if (!isScanning) {
        return (
            <View style={styles.buttonContainerStatic}>
                <TouchableOpacity style={styles.scanButton} onPress={() => setIsScanning(true)}>
                    <Text style={styles.scanButtonText}>Verificar Maquina libre</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <Modal visible={isScanning} animationType="slide" onRequestClose={() => setIsScanning(false)}>
            <View style={styles.container}>
                <CameraView
                    style={styles.camera}
                    facing={facing}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "ean13", "ean8", "upc_e", "code128"],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.scanArea}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                    </View>
                </CameraView>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                        <Text style={styles.text}>Flip Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => setIsScanning(false)}>
                        <Text style={styles.text}>Close</Text>
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
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
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
        justifyContent: 'space-between',
    },
    button: {
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 5,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    buttonContainerStatic: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanButton: {
        backgroundColor: '#0A84FF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    scanButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
