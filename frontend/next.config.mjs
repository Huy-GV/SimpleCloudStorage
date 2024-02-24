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
  };

  export default nextConfig;
