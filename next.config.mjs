/** @type {import('next').NextConfig} */
const OLD_UNITS = {
  unit1: "unit-1", unit2: "unit-2", unit3: "unit-3",
  "grade9-islam-unit4": "unit-4", "grade9-islam-unit5": "unit-5", "grade9-islam-unit6": "unit-6",
};

const nextConfig = {
  async redirects() {
    return [
      { source: "/quizzes/grade9-islam", destination: "/#subjects", permanent: true },
      { source: "/definitions", destination: "/", permanent: true },
      ...Object.entries(OLD_UNITS).map(([oldId, newId]) => ({
        source: `/quizzes/grade9-islam/${oldId}`,
        destination: `/islam/grade-9/${newId}/flashcards`,
        permanent: true,
      })),
    ];
  },
};
export default nextConfig;
