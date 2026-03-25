export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/charities',
      permanent: false,
    },
  };
}

export default function Home() {
  return null;
}