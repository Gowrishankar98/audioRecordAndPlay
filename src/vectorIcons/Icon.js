import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import Octicons from 'react-native-vector-icons/Octicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Zocial from 'react-native-vector-icons/Zocial';

/**
 * Universal Icon Component
 *
 * @param {string} family - Icon family (material, materialCommunity, antDesign, fontAwesome, fontAwesome5, fontAwesome6, ionicons, feather, entypo, evilIcons, fontisto, foundation, octicons, simpleLineIcons, zocial)
 * @param {string} name - Icon name
 * @param {number} size - Icon size (default: 24)
 * @param {string} color - Icon color (default: '#000')
 * @param {object} style - Additional styles
 * @param {object} ...props - Other props to pass to the icon component
 */
const Icon = ({
  family = 'material',
  name,
  size = 24,
  color = '#000',
  style,
  ...props
}) => {
  if (!name) {
    console.warn('Icon component requires a "name" prop');
    return null;
  }

  const iconProps = {
    name,
    size,
    color,
    style,
    ...props,
  };

  switch (family.toLowerCase()) {
    case 'material':
    case 'materialicons':
      console.log('Rendering MaterialIcons:', name, size, color);
      return <MaterialIcons {...iconProps} />;

    case 'materialcommunity':
    case 'materialcommunityicons':
      return <MaterialCommunityIcons {...iconProps} />;

    case 'antdesign':
    case 'ant':
      return <AntDesign {...iconProps} />;

    case 'fontawesome':
    case 'fa':
      return <FontAwesome {...iconProps} />;

    case 'fontawesome5':
    case 'fa5':
      return <FontAwesome5 {...iconProps} />;

    case 'fontawesome6':
    case 'fa6':
      return <FontAwesome6 {...iconProps} />;

    case 'ionicons':
    case 'ion':
      return <Ionicons {...iconProps} />;

    case 'feather':
      return <Feather {...iconProps} />;

    case 'entypo':
      return <Entypo {...iconProps} />;

    case 'evilicons':
    case 'evil':
      return <EvilIcons {...iconProps} />;

    case 'fontisto':
      return <Fontisto {...iconProps} />;

    case 'foundation':
      return <Foundation {...iconProps} />;

    case 'octicons':
    case 'oct':
      return <Octicons {...iconProps} />;

    case 'simplelineicons':
    case 'simple':
      return <SimpleLineIcons {...iconProps} />;

    case 'zocial':
      return <Zocial {...iconProps} />;

    default:
      console.warn(
        `Unknown icon family: ${family}. Using MaterialIcons as fallback.`,
      );
      return <MaterialIcons {...iconProps} />;
  }
};

export default Icon;
