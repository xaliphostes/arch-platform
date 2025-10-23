import React, { useState } from 'react';
import {
    IsoContoursPanel,
    DeformPanel,
    VectorsPanel,
    TectonicStressPanel,
    PressurePanel,
    GeneralDisplayPanel
} from './panels';

//import './collapsiblePanel.css';

export const RightPanel: React.FC = () => {
    const [isContoursOpen, setIsContoursOpen] = useState(true);
    const [isStressOpen, setIsStressOpen] = useState(true);
    const [isPressureOpen, setIsPressureOpen] = useState(false);
    const [isDeformOpen, setIsDeformOpen] = useState(false);
    const [isVectorsOpen, setIsVectorsOpen] = useState(false);
    const [isGeneralOpen, setGeneralOpen] = useState(false);

    return (
        <div className="right-panel">
            <GeneralDisplayPanel 
                isOpen={isGeneralOpen}
                onToggle={() => setGeneralOpen(!isGeneralOpen)}
            />

            <IsoContoursPanel
                isOpen={isContoursOpen}
                onToggle={() => setIsContoursOpen(!isContoursOpen)}
            />

            {/* <DeformPanel
                isOpen={isDeformOpen}
                onToggle={() => setIsDeformOpen(!isDeformOpen)}
            /> */}
            
            <VectorsPanel
                isOpen={isVectorsOpen}
                onToggle={() => setIsVectorsOpen(!isVectorsOpen)}
            />

            <br />
            <hr />
            <br />

            <TectonicStressPanel
                isOpen={isStressOpen}
                onToggle={() => setIsStressOpen(!isStressOpen)}
            />

            {/* <PressurePanel
                isOpen={isPressureOpen}
                onToggle={() => setIsPressureOpen(!isPressureOpen)}
            /> */}
        </div>
    );
};
