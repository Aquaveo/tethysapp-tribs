import { useContext } from "react";

import SlideSheet from "components/dialogs/SlideSheet";
import LegendCard from "components/project/panels/LegendCard";
import { LegendsContext, LegendsRegistryContext } from "react-tethys/context";
import { compareLegends } from "lib/legends";

/**
 * The global Legends side panel, toggled from the Project panel header: one LegendCard per visible layer that has
 * a legend, in project-tree order. Layers register their legend entries with useLegendEntry while they are visible.
 */
const LegendsPanel = () => {
  const { showLegends, legends } = useContext(LegendsContext);
  const { setShowLegends } = useContext(LegendsRegistryContext);
  const entries = Object.values(legends).sort(compareLegends);

  return (
    <SlideSheet
      title="Legends"
      placement="end"
      show={showLegends}
      onClose={() => setShowLegends(false)}
      style={{ height: "fit-content" }}
    >
      {entries.length === 0 && (
        <div data-testid="legends-empty" style={{ fontSize: "0.9em", color: "#555" }}>
          No visible layers have a legend.
        </div>
      )}
      {entries.map((entry) => (
        <LegendCard
          key={entry.id}
          dataset={entry.dataset}
          uniqueId={entry.uniqueId}
          legendUrls={entry.legendUrls}
          subtitle={entry.subtitle}
          variable={entry.variable}
          realizationName={entry.realizationName}
          onColorRampChange={entry.onColorRampChange}
        />
      ))}
    </SlideSheet>
  );
};

export default LegendsPanel;
