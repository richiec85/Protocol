import React from 'react';

interface EmptyProps {
    msg: string;
}

const Empty: React.FC<EmptyProps> = ({ msg }) => (
    <div
    style={{
        textAlign: 'center',
        padding: '40px 0',
        color: 'var(--muted)',
                                                  fontSize: 13,
    }}
    >
    {msg}
    </div>
);

export default Empty;
