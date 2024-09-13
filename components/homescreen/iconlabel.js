import React from 'react';
import { View , StyleSheet ,Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';


const IconLabel = ({name , label ,color ,distance, time}) => {
    return (
        <View style={styles.container} >

      <Icon name={name} size={20} color={color} />
      <Text style={styles.textstyle}>{distance}</Text>
      <Icon name={label} size={20} color={color} />
        <Text style={styles.textstyle}>{time}</Text>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: 180,
        marginRight:165 ,
        size: 20,
        alignContent: 'center',
    },
    textstyle: {
        fontSize: 17,
         
        color: 'black',
        alignSelf: 'flex-start',
        marginTop: 2,
        marginRight: 10,
    },
});

export default IconLabel;