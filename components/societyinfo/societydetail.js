import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, RefreshControl, Platform,  Linking} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons'; 
import { auth, db } from '../../firebase';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-based
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const SocietyDetailScreen = ({ route, navigation }) => {
  const { societyId } = route.params;
  const [society, setSociety] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSocietyAdmin, setIsSocietyAdmin] = useState(false);
  const [expandedPortfolio, setExpandedPortfolio] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [portfolioMembers, setPortfolioMembers] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [aboutInfo, setAboutInfo] = useState([]);
  const [interviewLocations, setInterviewLocations] = useState([]);

  
  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && (userDoc.data().isAdmin || userDoc.data().societyId === societyId)) {
          setIsAdmin(true);
          if (userDoc.data().societyAdmins && userDoc.data().societyAdmins.includes(societyId)) {
            setIsSocietyAdmin(true);
          }
        }
      }
    };
    checkAdmin();
  }, [societyId]);

  const fetchPortfolioMembers = async (portfolios, roles) => {
    let membersData = {};
  
    // Collect all member IDs from all portfolios
    let allMembers = portfolios.reduce((acc, portfolio) => {
      if (portfolio.members && portfolio.members.length > 0) {
        acc.push(...portfolio.members);
      }
      return acc;
    }, []);
  
    try {
      // Fetch user details for all members
      const membersSnapshot = await db.collection('users')
        .where('__name__', 'in', allMembers)
        .get();
  
      // Create a mapping of member IDs to their role information
      let memberRoleMap = {};
      membersSnapshot.forEach(doc => {
        const memberData = doc.data();
        memberRoleMap[doc.id] = {
          name: memberData.name,
          department: memberData.department,
          roles: {}
        };
      });
  
      // Assign roles to each member based on portfolios
      portfolios.forEach(portfolio => {
        if (portfolio.members && portfolio.members.length > 0) {
          portfolio.members.forEach(memberId => {
            const userRoles = roles[portfolio.name] || {};
            const roleList = Object.entries(userRoles).reduce((roles, [role, value]) => {
              if (Array.isArray(value)) {
                if (value.includes(memberId)) {
                  roles.push(role);
                }
              } else if (value === memberId) {
                roles.push(role);
              }
              return roles;
            }, []).join(', ');
  
            if (memberRoleMap[memberId]) {
              memberRoleMap[memberId].roles[portfolio.name] = roleList || 'No Role';
            }
          });
        }
      });
  
      // Build the membersData structure
      portfolios.forEach(portfolio => {
        if (portfolio.members && portfolio.members.length > 0) {
          if (!membersData[portfolio.name]) {
            membersData[portfolio.name] = [];
          }
          portfolio.members.forEach(memberId => {
            if (memberRoleMap[memberId]) {
              membersData[portfolio.name].push({
                name: memberRoleMap[memberId].name,
                department: memberRoleMap[memberId].department,
                role: memberRoleMap[memberId].roles[portfolio.name] || 'No Role'
              });
            }
          });
        }
      });
  
      setPortfolioMembers(membersData);
    } catch (error) {
      console.error("Error fetching member details:", error);
    }
  };
  

  useEffect(() => {
    const fetchSocietyData = async () => {
      try {
        const societyDoc = await db.collection('societies').doc(societyId).get();
        if (societyDoc.exists) {
          const societyData = societyDoc.data();
      
          setSociety(societyData);
          fetchPortfolioMembers(societyData.portfolios || [], societyData.roles || {});
          setAboutInfo(societyData.aboutInfo || []);
      
          // Ensure interview locations are set
          if (Array.isArray(societyData.locations)) { // Updated to handle 'locations'
            setInterviewLocations(societyData.locations);
          } else {
            setInterviewLocations([]);
          }
        }
      } catch (error) {
        console.error("Error fetching society details:", error);
      }
    };
  
    fetchSocietyData();
  }, [societyId]);
  
  


  const handleEdit = () => {
    navigation.navigate('EditSociety', { societyId });
  };
  const handleToggleAbout = () => {
    setExpandedAbout(!expandedAbout);
  };

  const handleAssignAdmin = () => {
    navigation.navigate('AssignAdmin', { societyId });
  };

  const handleAddPortfolio = () => {
    navigation.navigate('AddPortfolio', { societyId });
  };

  const handleAddEvent = () => {
    navigation.navigate('AddEvent', { societyId });
  };


  const handleTogglePortfolio = (portfolioName) => {
  
    setExpandedPortfolio(expandedPortfolio === portfolioName ? null : portfolioName);
  };

  const handleToggleEvent = (eventName) => {
    setExpandedEvent(expandedEvent === eventName ? null : eventName);
  };

  const handleInstagramLinkPress = () => {
    if (society?.instagram) {
      Linking.openURL(society.instagram);
    }
  };

  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const societyDoc = await db.collection('societies').doc(societyId).get();
      if (societyDoc.exists) {
        const societyData = societyDoc.data();
        setSociety(societyData);
        fetchPortfolioMembers(societyData.portfolios || [], societyData.roles || {});
      }
    } catch (error) {
      console.error("Error fetching society details:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!society) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F2F2F2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Society Details</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollViewContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {society.logo && (
          <View style={styles.logoContainer}>
            <Image source={{ uri: society.logo }} style={styles.logo} />
            {(isAdmin || isSocietyAdmin) && (
              <TouchableOpacity onPress={() => {}} style={styles.changeLogoButton}>
                <Ionicons name="camera" size={24} color="#F2F2F2" />
              </TouchableOpacity>
            )}
          </View>
        )}
        <Text style={styles.title}>{society.name}</Text>
        <Text style={styles.slogan}>
          <FontAwesome name="quote-left" size={18} color="#ffc145" /> {society.slogan} <FontAwesome name='quote-right' size={18} color="#ffc145" />
        </Text>
        <Text style={styles.description}>{society.description}</Text>

        <View style={styles.socialMediaContainer}>
          <TouchableOpacity onPress={handleInstagramLinkPress}>
            <Ionicons name="logo-instagram" size={24} color="#F2F2F2" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.aboutButton} onPress={handleToggleAbout}>
        <Ionicons name='information-circle' size={24} color={'black'}/><Text style={styles.aboutButtonText}>About</Text>
        </TouchableOpacity>

        {expandedAbout && (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.aboutScrollView}
  >
    {aboutInfo.map((info, index) => (
      <View key={index} style={styles.aboutContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('AboutSection' , {societyId})}>
          <Image source={{ uri: info.logo }} style={styles.aboutImage} />
          <Text style={styles.aboutTitle}>Name: {info.name}</Text>
          <Text style={styles.aboutQuote}>Quote: {info.quote}</Text>
          <Text style={styles.aboutRole}>Role: {info.role}</Text>
        </TouchableOpacity>
      </View>
    ))}
  </ScrollView>
)}          


<Text style={styles.sectionTitle}><Ionicons name="people" size={22} color="#ffc145" /> <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#F2F2F2' }}>Portfolios</Text></Text>
        {society.portfolios && society.portfolios.length > 0 ? (
  society.portfolios.map((portfolio, index) => (
    <View key={index} style={styles.portfolioContainer}>
      <TouchableOpacity onPress={() => handleTogglePortfolio(portfolio.name)}>
        <Text style={styles.portfolioTitle}>
          <Ionicons name="briefcase" size={20} color="#ffc145" /> {portfolio.name}
        </Text>
      </TouchableOpacity>
      {expandedPortfolio === portfolio.name && (
        <View style={styles.portfolioMembers}>
          <Text style={styles.memberCount}>{portfolio.members?.length || 0} members</Text>
          {portfolioMembers[portfolio.name]?.map((member, idx) => (
            <Text key={idx} style={styles.memberText}>
              <Ionicons name="person" size={16} color="#F2F2F2" /> {member.name} - {member.department} ({member.role})
            </Text>
          ))}
        </View>
      )}
    </View>
  ))
) : (
  <Text style={styles.noItemsText}>No portfolios available.</Text>
)}
<Text style={styles.sectionTitle}><Ionicons name="calendar" size={22} color="#ffc145" /> <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#F2F2F2' }}>Events</Text></Text>
        {society.events && society.events.length > 0 ? (
          society.events.map((event, index) => (
            <View key={index} style={styles.eventContainer}>
              <TouchableOpacity onPress={() => handleToggleEvent(event.name)}>
                <Text style={styles.eventTitle}><Ionicons name="calendar" size={20} color="#ffc145" /> {event.name}</Text>
              </TouchableOpacity>
              {expandedEvent === event.name && (
                <View style={styles.eventDetails}>
                  <Text style={styles.eventDate}><Ionicons name="time" size={16} color="#F2F2F2" /> {formatDate(event.date)}</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noItemsText}>No events available.</Text>
        )}

        {/* New sections */}
        

        <Text style={styles.sectionTitle}><FontAwesome name="briefcase" size={22} color="#ffc145" /> <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#F2F2F2' }}>Main Work</Text></Text>
      <Text style={styles.infoText}>{society.mainWork || 'No main work description available'}</Text>
      <Text style={styles.sectionTitle}>
          <FontAwesome name="clipboard" size={22} color="#ffc145" /> 
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#F2F2F2' }}> Open for Interview</Text>
        </Text>
        <Text style={styles.infoText}>{society.isOpenForInterviews ? 'Yes' : 'No'}</Text>
        
        {/* {interviewLocations.length > 0 && (
  <View style={{ marginTop: 20, paddingHorizontal: 10 }}>
    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F2F2F2', marginBottom: 10 }}>
      <Ionicons name="location" size={22} color="#ffc145" /> Interview Locations:
    </Text>
    <View style={{ flexDirection: 'column' }}>
      {interviewLocations.map((location, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="location-outline" size={18} color="#F2F2F2" />
          <Text style={{ fontSize: 16, color: '#F2F2F2', marginLeft: 8 }}>{location}</Text>
        </View>
      ))}
    </View>
  </View>
)} */}


        <View style={styles.adminButtonsContainer}>
          {(isAdmin || isSocietyAdmin) && (
            <>
              <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditSociety', { societyId })}>
                <Ionicons name="create" size={20} color="#F2F2F2" />
                <Text style={styles.editButtonText}>Edit Society</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.assignAdminButton} onPress={() => navigation.navigate('AssignAdmin', { societyId })}>
                <Ionicons name="person-add" size={20} color="#F2F2F2" />
                <Text style={styles.assignAdminButtonText}>Assign Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addPortfolioButton} onPress={() => navigation.navigate('AddPortfolio', { societyId })}>
                <Ionicons name="briefcase" size={20} color="#F2F2F2" />
                <Text style={styles.addPortfolioButtonText}>Add Portfolio</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addEventButton} onPress={() => navigation.navigate('AddEvent', { societyId })}>
                <Ionicons name="calendar" size={20} color="#F2F2F2" />
                <Text style={styles.addEventButtonText}>Add Event</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      <View>
        <TouchableOpacity style={styles.broadcast} onPress={() => navigation.navigate('Broadcast', { societyId })}>
          <Text style={styles.broadcastText}>Broadcast</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#474747',
    flexDirection: 'row',
    paddingVertical: Platform.OS === 'ios' ? 20 : 15,
    paddingHorizontal: 10,
    borderRadius: 80,
    marginBottom: Platform.OS === 'ios' ? 20 : 15,
    width: 300,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 0 : 40,
  },
  backButton: {
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: '#F2F2F2ffb',
    fontSize: Platform.OS === 'ios' ? 20 : 20,
    fontWeight: 'bold',
    marginLeft: Platform.OS === 'ios' ? 30 : 30,
  },
  scrollViewContainer: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changeLogoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ffc145',
    padding: 8,
    borderRadius: 50,
  },
  title: {
    fontSize: 28,
    color: '#F2F2F2',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  slogan: {
    fontSize: 16,
    color: '#ffc145',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },

  aboutButton: {
    alignSelf: 'center',
    backgroundColor: '#FFC145',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutButtonText: {
    fontSize: 18,
    color: '#121212',
    marginRight: 10,
    alignSelf: 'center',
    marginTop : 10,
    
  },
  aboutScrollView: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  aboutButton: {
    alignSelf: 'center',
    backgroundColor: '#FFC145',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutButtonText: {
    fontSize: 18,
    color: '#121212',
    marginRight: 10,
    alignSelf: 'center',
    marginBottom: 5,
  },
  aboutScrollView: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  aboutContainer: {
    backgroundColor: '#141414',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    borderColor: '#ffc145',
    borderWidth: 1,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
  },
  aboutImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  aboutTitle: {
    fontSize: 16,
    color: '#ffc145',
    marginBottom: 5,
  },
  aboutQuote: {
    fontSize: 14,
    color: '#F2F2F2',
    textAlign: 'center',
    marginBottom: 5,
  },
  aboutRole: {
    fontSize: 14,
    color: '#F2F2F2',
    marginBottom: 10,
  },
  socialMediaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 5,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#F2F2F2',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#F2F2F2',
    textAlign: 'center',
    marginVertical: 10,
  },
  locationsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  locationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F2F2F2',
    marginBottom: 10,
  },
  locationList: {
    flexDirection: 'column',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#F2F2F2',
    marginLeft: 8,
  },
  portfolioContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  portfolioTitle: {
    fontSize: 18,
    color: '#ffc145',
    fontWeight: 'bold',
  },
  portfolioMembers: {
    marginTop: 10,
  },
  memberCount: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  memberText: {
    fontSize: 16,
    color: '#F2F2F2',
    marginBottom: 5,
  },
  eventContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  eventTitle: {
    fontSize: 18,
    color: '#ffc145',
    fontWeight: 'bold',
  },
  eventDetails: {
    marginTop: 10,
  },
  eventDate: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  eventDescription: {
    fontSize: 16,
    color: '#F2F2F2',
  },
  noItemsText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 20,
  },
  adminButtonsContainer: {
    marginTop: 30,
  },
  editButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  editButtonText: {
    color: '#F2F2F2',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  assignAdminButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  assignAdminButtonText: {
    color: '#F2F2F2',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addPortfolioButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  addPortfolioButtonText: {
    color: '#F2F2F2',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addEventButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  addEventButtonText: {
    color: '#F2F2F2',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  locationSection: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F2F2F2',
    marginBottom: 10,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#F2F2F2',
    marginLeft: 8,
  },

  addAboutButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  addAboutButtonText: {
    color: '#F2F2F2',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingText: {
    color: '#F2F2F2',
    textAlign: 'center',
    fontSize: 18,
    marginTop: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  broadcast:{
    backgroundColor: '#ffc145',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    marginHorizontal: 30,
  },
  broadcastText:{
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',

  }

});

export default SocietyDetailScreen;
