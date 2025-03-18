<?php
/**
 * Main entry point for the web development environment
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Debugger</title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .content {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #1a73e8;
        }
        code {
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 4px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        }
        .test-area {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
    </style>
    <!-- Include the web debugger script -->
    <script src="js/dev-overlay.js" type="module"></script>
</head>
<body>
    <div class="content">
        <h1>Web Debugger Development Environment</h1>
        <p>This is a testing environment for the Web Debugger overlay. Use the overlay tools to inspect and debug the elements on this page.</p>
        <p>The overlay should appear automatically in the bottom-right corner of the page.</p>

        <div class="test-area">
            <h2>Test Area</h2>
            <p>This area contains various HTML elements for testing the overlay's inspection capabilities.</p>
            
            <div style="margin: 20px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9;">
                <h3>Element with margin, padding, and border</h3>
                <p>This element has the following styles:</p>
                <ul>
                    <li><code>margin: 20px</code></li>
                    <li><code>padding: 15px</code></li>
                    <li><code>border: 1px solid #ccc</code></li>
                    <li><code>background-color: #f9f9f9</code></li>
                </ul>
            </div>
            
            <img src="https://placehold.co/600x400" alt="Placeholder Image" width="300" height="200">
        </div>
    </div>
    <?php echo '<!-- Page generated at ' . date('Y-m-d H:i:s') . ' -->'; ?>
</body>
</html> 