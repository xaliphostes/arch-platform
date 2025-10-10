import React, { useState } from 'react';
import {
    IsoContoursPanel,
    DeformPanel,
    TectonicStressPanel,
    PressurePanel
} from './panels';
//import './collapsiblePanel.css';

export const RightPanel: React.FC = () => {
    const [isContoursOpen, setIsContoursOpen] = useState(true);
    const [isStressOpen, setIsStressOpen] = useState(false);
    const [isPressureOpen, setIsPressureOpen] = useState(false);
    const [isDeformOpen, setIsDeformOpen] = useState(false);

    return (
        <div className="right-panel">
            <IsoContoursPanel
                isOpen={isContoursOpen}
                onToggle={() => setIsContoursOpen(!isContoursOpen)}
            />

            <DeformPanel
                isOpen={isDeformOpen}
                onToggle={() => setIsDeformOpen(!isDeformOpen)}
            />

            <br />
            <hr />
            <br />

            <TectonicStressPanel
                isOpen={isStressOpen}
                onToggle={() => setIsStressOpen(!isStressOpen)}
            />

            <PressurePanel
                isOpen={isPressureOpen}
                onToggle={() => setIsPressureOpen(!isPressureOpen)}
            />
        </div>
    );
};
