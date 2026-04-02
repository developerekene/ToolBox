module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        'react-native-reanimated/plugin', // This is now safe because we installed it in Step 1
      ],
    };
  };