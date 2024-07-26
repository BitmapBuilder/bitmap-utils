import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// MondrianLayout implementation
class MondrianLayout {
    width: number;
    height: number;
    slots: any[];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.slots = [{x: 0, y: 0, w: width, h: height}];
    }

    place(size: number) {
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (slot.w >= size && slot.h >= size) {
                const newSlot = {x: slot.x, y: slot.y, r: size};
                this.slots.splice(i, 1);
                if (slot.w > size) {
                    this.slots.push({x: slot.x + size, y: slot.y, w: slot.w - size, h: slot.h});
                }
                if (slot.h > size) {
                    this.slots.push({x: slot.x, y: slot.y + size, w: size, h: slot.h - size});
                }
                return {position: {x: newSlot.x, y: newSlot.y}, r: newSlot.r};
            }
        }
        return null;
    }

    getSize() {
        return {width: this.width, height: this.height};
    }
}

// CanvasRenderer component
const CanvasRenderer: React.FC<{data: number[], style?: React.CSSProperties, color?: string}> = ({ data, style, color = 'orange' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!data || !canvasRef.current) return;
        renderImage(data);
    }, [data, canvasRef]);

    function renderImage(data: number[]) {
        if (!canvasRef.current || data.length === 0) return;

        let blockWeight = data.reduce((sum, size) => sum + size * size, 0);
        const blockWidth = Math.ceil(Math.sqrt(blockWeight));
        const mondrian = new MondrianLayout(blockWidth, blockWidth);
        const mondrianSlots = data.map(size => mondrian.place(size));

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const clientRect = canvas.getBoundingClientRect();
        const padd = 0.5;
        const mondrianSize = mondrian.getSize();
        
        const scaleX = clientRect.width / (mondrianSize.width - padd);
        const scaleY = clientRect.height / (mondrianSize.height - padd);
        const scale = Math.min(scaleX, scaleY);

        const offsetX = (clientRect.width - (mondrianSize.width - padd) * scale) / 2;
        const offsetY = (clientRect.height - (mondrianSize.height - padd) * scale) / 2;

        canvas.width = clientRect.width;
        canvas.height = clientRect.height;

        mondrianSlots.forEach(slot => {
            if (slot) {
                const x = slot.position.x * scale;
                const y = slot.position.y * scale;
                const size = (slot.r - padd) * scale;
                ctx.fillStyle = color;
                ctx.fillRect(offsetX + x, offsetY + y, size, size);
            }
        });
    }

    return <canvas ref={canvasRef} style={style} />;
};

// Main Page2DGeneration component
const Page2DGeneration: React.FC = () => {
    const [blockHeight, setBlockHeight] = useState('');
    const [txArray, setTxArray] = useState<number[]>([]);

    const anatomyClassification = (amount: number) => {
        const thresholds = [0.01, 0.1, 1, 10, 100, 1000, 10000, 100000, 1000000];
        for (let idx = 0; idx < thresholds.length; idx++) {
            if (amount <= thresholds[idx]) {
                return idx + 1;
            }
        }
        return 10;
    };

    const fetchAndSaveTransactions = async () => {
        try {
            const response = await axios.get(`https://blockchain.info/block-height/${blockHeight}?format=json`);
            const blockData = response.data;
            const blocks = blockData.blocks || [];
            if (blocks.length > 0) {
                const transactions = blocks[0].tx || [];
                const txValues = transactions.map((tx: any) => 
                    tx.out.reduce((sum: number, output: any) => sum + (output.value || 0), 0) / 100000000
                );
                const content = txValues.join('\n');
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${blockHeight}_tx_values.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                alert('Transaction values have been saved to a file.');
            } else {
                console.error('No blocks found for the specified block height.');
            }
        } catch (error) {
            console.error('Error fetching block data:', error);
        }
    };

    const loadAndDrawTransactions = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const txValues = content.split('\n').map(Number);
                const classifiedTypes = txValues.map(anatomyClassification);
                setTxArray(classifiedTypes);
            };
            reader.readAsText(file);
        }
    };

    return (
        <>
            <h2 style={{ marginBottom: '0px' }}>2D PREVIEW GENERATION</h2>
            <span>
                Simple implementation of <a href='https://bitfeed.live/' target='_blank' rel='noopener noreferrer'>Bitfeed's</a> visualization mode for transactions.
            </span>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ marginBottom: '0px' }}>Enter Block Height</h3>
                <div>
                    <input
                        type="text"
                        value={blockHeight}
                        onChange={(event) => setBlockHeight(event.target.value)}
                        style={{ width: '300px' }}
                        placeholder="Enter block height"
                    />
                    <button onClick={fetchAndSaveTransactions}>Fetch and Save</button>
                </div>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ marginBottom: '0px' }}>Load Transaction Data</h3>
                <input type="file" accept=".txt" onChange={loadAndDrawTransactions} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ marginBottom: '0px' }}>Canvas Renderer</h3>
                <CanvasRenderer color='orange' data={txArray} style={{ width: '250px', height: '250px', maxWidth: '250px', maxHeight: '250px', border: 'solid 1px', padding: '20px' }} />
            </div>
        </>
    );
};

export default Page2DGeneration;