/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', '@azure/msal-node'],
};

module.exports = nextConfig;
