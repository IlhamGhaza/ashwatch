import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ashwatch/data/datasources/bom_remote_datasource.dart';
import 'package:ashwatch/data/repositories/vaa_repository_impl.dart';
import 'package:ashwatch/domain/usecases/get_active_advisories.dart';
import 'package:ashwatch/presentation/blocs/darwin_vaa_bloc.dart';
import 'package:ashwatch/presentation/pages/map_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations and system UI overlay matching default dark theme
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF141B2D),
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Wire up dependencies
  final datasource = BomRemoteDatasource();
  final repository = VaaRepositoryImpl(datasource: datasource);
  final getActiveAdvisories = GetActiveAdvisories(repository);

  runApp(AshWatchApp(getActiveAdvisories: getActiveAdvisories));
}

class AshWatchApp extends StatelessWidget {
  final GetActiveAdvisories getActiveAdvisories;

  const AshWatchApp({super.key, required this.getActiveAdvisories});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => DarwinVaaBloc(getActiveAdvisories: getActiveAdvisories),
      child: MaterialApp(
        title: 'AshWatch',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          brightness: Brightness.dark,
          scaffoldBackgroundColor: const Color(0xFF0D1117),
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFFFF6B35),
            brightness: Brightness.dark,
            surface: const Color(0xFF141B2D),
          ),
          fontFamily: 'Roboto',
        ),
        home: const MapPage(),
      ),
    );
  }
}
