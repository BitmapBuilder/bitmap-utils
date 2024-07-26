import { useState } from 'react';
import axios from 'axios';
import CanvasRenderer from '../components/CanvasRenderer';
import DIVRenderer from '../components/DIVRenderer';
import SVGRenderer from '../components/SVGRenderer';

const anatomyClassification = (amount) => {
    const thresholds = [0.01, 0.1, 1, 10, 100, 1000, 10000, 100000, 1000000];
    for (let idx = 0; idx < thresholds.length; idx++) {
        if (amount <= thresholds[idx]) {
            return idx + 1;
        }
    }
    return 10;
};

export default function Page2DGeneration() {
    const [blockHeight, setBlockHeight] = useState('');
    const [txArray, setTxArray] = useState([]);

    const fetchAndSaveTransactions = async () => {
        try {
            const response = await axios.get(`https://blockchain.info/block-height/${blockHeight}?format=json`);
            const blockData = response.data;
            const blocks = blockData.blocks || [];
            if (blocks.length > 0) {
                const transactions = blocks[0].tx || [];
                const txValues = transactions.map(tx => 
                    tx.out.reduce((sum, output) => sum + (output.value || 0), 0) / 100000000
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

    const loadAndDrawTransactions = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
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
                <h3 style={{ marginBottom: '0px' }}>DIV Renderer</h3>
                <DIVRenderer color='orange' data={txArray} style={{ width: '250px', height: '250px', maxWidth: '250px', maxHeight: '250px', border: 'solid 1px', padding: '20px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ marginBottom: '0px' }}>Canvas Renderer</h3>
                <CanvasRenderer color='orange' data={txArray} style={{ width: '250px', height: '250px', maxWidth: '250px', maxHeight: '250px', border: 'solid 1px', padding: '20px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ marginBottom: '0px' }}>SVG Renderer</h3>
                <SVGRenderer color='orange' data={txArray} style={{ width: '250px', height: '250px', maxWidth: '250px', maxHeight: '250px', border: 'solid 1px', padding: '20px' }} />
            </div>
        </>
    );
}