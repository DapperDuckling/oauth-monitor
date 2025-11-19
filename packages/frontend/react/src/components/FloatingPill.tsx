import { Button, Fade, Paper, Stack, Typography, alpha } from "@mui/material";
import { OmcDispatchType } from "../types.js";
import { useOauthMonitor } from "../use-oauth-monitor.js";

export const FloatingPill = () => {
    const [omcContext, omcDispatch] = useOauthMonitor();

    const handleOpenLogin = () => {
        omcDispatch({ type: OmcDispatchType.SHOW_LOGIN });
        omcContext.omcClient?.handleLogin(true);
    };

    return (
        <Fade in={true} timeout={300}>
            <Paper
                elevation={6}
                sx={{
                    position: 'fixed',
                    bottom: '32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: (theme) => theme.zIndex.snackbar, // Safe z-index handling
                    bgcolor: alpha('#313131', 0.9), // MUI alpha helper
                    backdropFilter: 'blur(10px)',
                    color: 'common.white',
                    p: 1,
                    pl: 2.5,
                    borderRadius: 999, // pill shape
                    border: '1px solid',
                    borderColor: alpha('#7a7a7a', 0.5),
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Stack direction="column">
                        <Typography variant="subtitle2" fontWeight="bold" lineHeight={1.2}>
                            Not Logged In
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#B9B9B9' }}>
                            Viewing read-only mode
                        </Typography>
                    </Stack>

                    <Button
                        onClick={handleOpenLogin}
                        variant="contained"
                        disableElevation
                        sx={{
                            bgcolor: '#79b4c3',
                            '&:hover': { bgcolor: '#69a4b3' },
                            color: 'white',
                            fontWeight: 'bold',
                            borderRadius: 999,
                            textTransform: 'none',
                            px: 2 // horizontal padding
                        }}
                    >
                        Login
                    </Button>
                </Stack>
            </Paper>
        </Fade>
    // <Fade in={true} timeout={300}>
    //     <div style={{
    //         position: 'fixed',
    //         bottom: '32px',
    //         left: '50%',
    //         transform: 'translateX(-50%)',
    //         zIndex: 10,
    //         background: 'rgba(49, 49, 49, 0.9)',
    //         backdropFilter: 'blur(10px)',
    //         color: 'white',
    //         padding: '8px',
    //         borderRadius: '9999px',
    //         boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    //         display: 'flex',
    //         alignItems: 'center',
    //         gap: '16px',
    //         transition: 'transform 0.3s',
    //         border: '1px solid rgba(122, 122, 122, 0.5)'
    //     }}>
    //         <div style={{display: 'flex', flexDirection: 'column', marginLeft: '12px'}}>
    //             <Typography sx={{fontSize: '12px', fontWeight: 'bold'}}>Not Logged In</Typography>
    //             <Typography sx={{fontSize: '10px', color: '#B9B9B9'}}>Viewing read-only mode</Typography>
    //         </div>
    //         <Button
    //             onClick={openLoginOverlay}
    //             variant="contained"
    //             sx={{
    //                 background: '#79b4c3',
    //                 '&:hover': {background: '#69a4b3'},
    //                 color: 'white',
    //                 fontSize: '12px',
    //                 fontWeight: 'bold',
    //                 padding: '8px 16px',
    //                 borderRadius: '9999px',
    //                 textTransform: 'none'
    //             }}>
    //             Login
    //         </Button>
    //     </div>
    // </Fade>
    );
};
