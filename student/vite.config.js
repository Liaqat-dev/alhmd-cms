import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
    base: '/',
    plugins: [tailwindcss(), react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, '../shared'),
            // Files under @shared live outside this app's directory, so Node's
            // normal upward node_modules lookup won't find these packages when
            // only `student/` is installed (e.g. on a hosting platform that runs
            // `npm install` scoped to this folder). Pin them to this app's own
            // node_modules so the shared folder never depends on a root install.
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
            'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
            'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
            'axios': path.resolve(__dirname, 'node_modules/axios'),
        },
    },
    server: {
        fs: {
            allow: [path.resolve(__dirname, '..')],
        },
    },
})