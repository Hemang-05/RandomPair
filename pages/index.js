import Head from 'next/head';
import Chat from '../components/Chat';

export default function Home() {
    return (
        <div>
            <Head>
                <title>Chat App</title>
                <meta name="description" content="Random pairing chat app" />
            </Head>
            <main>
                <Chat />
            </main>
        </div>
    );
}
