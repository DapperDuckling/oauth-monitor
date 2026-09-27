import { useOauthMonitor } from "@dapperduckling/oauth-monitor-react";
import DapperDucklingLogo from "../assets/logo.svg";

interface Props {
    logo?: string;
}

export const DapperDucklingLoginChild = ({logo}: Props) => {
    const [omcContext] = useOauthMonitor();

    return (
        <div style={{ position: "relative", height: 180, width: 180, margin: '0 auto' }}>
            <img
                src={logo ?? DapperDucklingLogo}
                style={{ height: "100%", width: "100%", objectFit: "contain" }}
                alt="DapperDuckling Logo"
            />
            {omcContext.ui.silentLoginInitiated && !omcContext.ui.showMustLoginOverlay && (
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "3px solid transparent",
                    borderTopColor: "#1976d2",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                }} />
            )}
        </div>
    );
};
