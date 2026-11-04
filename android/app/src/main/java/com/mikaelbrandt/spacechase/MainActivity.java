package com.mikaelbrandt.spacechase;

import android.os.Build;
import android.os.Bundle;
import android.view.RoundedCorner;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.util.Locale;

// The game runs edge to edge: system bars hidden (a swipe from the edge brings them back briefly), screen kept on,
// drawn into the camera cutout area too. Because it fills the whole screen, the page is told where the cutout and the
// rounded corners are (window.__lureSafeArea, CSS pixels), and keeps its UI inside them (game/core/safe-area.js).
public class MainActivity extends BridgeActivity {
    // Corners are curves: a point this share of the radius in from both edges is on screen.
    private static final float CORNER_SHARE = 0.35f;
    private String safeAreaJs = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        hideSystemBars();
        View decor = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decor, (v, insets) -> {
            measure(insets);
            return ViewCompat.onApplyWindowInsets(v, insets);
        });
        bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) { sendSafeArea(); }
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    // Cutout insets per side, and each side at least CORNER_SHARE of the largest corner radius, in CSS pixels.
    private void measure(WindowInsetsCompat insets) {
        Insets cut = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
        float corner = 0;
        WindowInsets platform = insets.toWindowInsets();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && platform != null) {
            int[] positions = { RoundedCorner.POSITION_TOP_LEFT, RoundedCorner.POSITION_TOP_RIGHT,
                RoundedCorner.POSITION_BOTTOM_LEFT, RoundedCorner.POSITION_BOTTOM_RIGHT };
            for (int p : positions) {
                RoundedCorner rc = platform.getRoundedCorner(p);
                if (rc != null) corner = Math.max(corner, rc.getRadius());
            }
        }
        float pad = corner * CORNER_SHARE, d = getResources().getDisplayMetrics().density;
        safeAreaJs = String.format(Locale.ROOT,
            "window.__lureSafeArea={top:%.1f,right:%.1f,bottom:%.1f,left:%.1f};dispatchEvent(new Event('lure-safearea'));",
            Math.max(cut.top, pad) / d, Math.max(cut.right, pad) / d, Math.max(cut.bottom, pad) / d, Math.max(cut.left, pad) / d);
        sendSafeArea();
    }

    private void sendSafeArea() {
        if (safeAreaJs != null && bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(safeAreaJs, null));
        }
    }
}
