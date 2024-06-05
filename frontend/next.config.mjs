/** @type {import('next').NextConfig} */
const nextConfig = {
    redirects: async () => {
      return [
        {
          source: '/',
          destination: '/files',
          permanent: true,
        },
      ];
    },
    output: 'export'
  };

  export default nextConfig;
