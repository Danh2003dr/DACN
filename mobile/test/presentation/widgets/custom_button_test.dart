import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:drug_traceability_mobile/presentation/widgets/custom_button.dart';

void main() {
  testWidgets('CustomButton displays text correctly', (WidgetTester tester) async {
    // Arrange
    const buttonText = 'Test Button';
    bool buttonPressed = false;

    // Act
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: buttonText,
            onPressed: () {
              buttonPressed = true;
            },
          ),
        ),
      ),
    );

    // Assert
    expect(find.text(buttonText), findsOneWidget);
    expect(buttonPressed, false);

    // Tap button
    await tester.tap(find.text(buttonText));
    await tester.pump();

    expect(buttonPressed, true);
  });

  testWidgets('CustomButton is disabled when isLoading is true', (WidgetTester tester) async {
    // Arrange
    bool buttonPressed = false;

    // Act
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Test',
            onPressed: () {
              buttonPressed = true;
            },
            isLoading: true,
          ),
        ),
      ),
    );

    // Assert
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    
    // Try to tap (should not work)
    await tester.tap(find.byType(CustomButton));
    await tester.pump();

    expect(buttonPressed, false);
  });
}

