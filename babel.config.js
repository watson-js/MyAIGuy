module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // Required for expo-routerouter/
            'react-native-reanimated/plugin',
            [
                'module-resolver',
                {
                    root: ['.'],
                    extension: ['.js', '.ts', '.tsx'],
                    alias: {
                        '@globals': './constants/global',
                        '@components': './components',
                        '@assets': './assets',
                        '@public': './public',
                        '@constants': './constants',
                        '@lib': './lib',
                    },
                },
            ],
        ],
    };
};
