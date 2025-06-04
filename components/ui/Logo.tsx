import React from 'react';
import { Image, ImageProps, StyleSheet } from 'react-native';

// Import the PNG image
// Note: For static local images, `require` is the standard way.
const logoImageSource = require('../../assets/images/yabble.png');

interface LogoProps extends Omit<ImageProps, 'source'> {
  width?: number;
  height?: number;
  // style prop will be inherited from ImageProps
}

const Logo: React.FC<LogoProps> = ({ width, height, style, ...rest }) => {
  // Create a combined style for dimensions and any other passed styles
  const imageStyle = StyleSheet.flatten([
    width !== undefined && { width },
    height !== undefined && { height },
    style, // Pass through any other styles applied to the Logo component
  ]);

  return <Image source={logoImageSource} style={imageStyle} {...rest} />;
};

export default Logo;
