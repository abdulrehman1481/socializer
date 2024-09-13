import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

const ContentCard = ({ logo, name, slogan, description, mainWork, isOpenForInterviews, societyId, isAdmin, onDelete }) => {
  const navigation = useNavigation();
  const logoSize = Dimensions.get('window').width * 0.12; // Logo size as a percentage of screen width

  const onClick = () => {
    navigation.navigate('SocietyDetail', { societyId });
  };

  const onDeletePress = () => {
    onDelete(societyId);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
      <TouchableOpacity style={styles.cardContainer} onPress={onClick}>
        <View style={styles.header}>
          <Image source={logo} style={[styles.logo, { width: logoSize, height: logoSize }]} />
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
            {isAdmin && (
              <TouchableOpacity onPress={onDeletePress} style={styles.deleteButtonContainer}>
                <Ionicons name="trash" size={20} color="#ff4d4d" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.slogan} numberOfLines={1} ellipsizeMode="tail">{slogan}</Text>
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionHeading}>Description</Text>
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">{description}</Text>
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="briefcase" size={16} color="#ffc145" />
            <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail"> Main Work: {mainWork || 'Not available'}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome name="clipboard" size={16} color="#ffc145" />
            <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail"> Open for Interviews: {isOpenForInterviews ? 'Yes' : 'No'}</Text>
          </View>
        </View>
        <View style={styles.bottomContainer}>
          <Text style={styles.bottomText}>Learn More</Text>
          <Ionicons name="arrow-forward" size={24} color="#ffffff" style={styles.arrowIcon} />
        </View>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '92%',
    backgroundColor: '#1e1e1e', // Slightly lighter background
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, // Slightly higher opacity for better visibility
    shadowRadius: 6,
    elevation: 10,
    marginVertical: 10,
    marginHorizontal: '4%',
    height: 300, // Increased height for better layout
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    borderRadius: 50,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 22, // Slightly larger font size for the name
    fontWeight: 'bold',
    color: '#ffffff', // Changed to white for better contrast
    fontFamily: 'sans-serif',
  },
  deleteButtonContainer: {
    padding: 5,
  },
  slogan: {
    fontSize: 16,
    color: '#ffcc00', // Brighter yellow for better visibility
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 5,
  },
  descriptionContainer: {
    marginBottom: 10,
  },
  descriptionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'sans-serif',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#d3d3d3', // Lighter gray for description text
    fontFamily: 'sans-serif',
  },
  infoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 10,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    color: '#ffffff', // Changed to white for better readability
    fontFamily: 'sans-serif',
    marginLeft: 5,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  bottomText: {
    fontSize: 18,
    fontFamily: 'sans-serif',
    color: '#cccccc', // Lighter gray for bottom text
  },
  arrowIcon: {
    marginLeft: 10,
  },
});

export default ContentCard;
