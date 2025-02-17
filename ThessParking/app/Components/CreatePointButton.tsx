import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type Props = {
  onPress: () => void;
};

export default function CreatePointButton({ onPress }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>+ New Parking Spot</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: '7%',
    alignSelf: 'center', // Centers horizontally
    backgroundColor: '#53a623',
    width: '75%',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 40,
    elevation: 5,
  },
  text: {
    alignSelf: 'center',
    color: '#faf3e6',
    fontSize: 25,
    fontWeight: 'bold',
  },
});
