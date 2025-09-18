/** @type {import('next').NextConfig} */

const nextConfig = {
  // async redirects() {
  //   return [
  //     {
  //       source: "/",
  //       destination: "/dashboard",
  //       permanent: true,
  //     },
  //   ];
  // },
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
