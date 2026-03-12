import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function Home({ auth }) {
    return (
        <AppLayout>
            <div className="max-w-xl mx-auto">
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h2 className="card-title">Dashboard</h2>
                        <p>Welcome back, <strong>{auth.user.name}</strong>. You are logged in.</p>
                        <div className="card-actions mt-4">
                            <Link href={route('devices.index')} className="btn btn-primary">
                                View Devices
                            </Link>
                            <Link href={route('devices.setup')} className="btn btn-outline">
                                Device Setup
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
