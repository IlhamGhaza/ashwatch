import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';
import 'package:ashwatch/domain/usecases/get_active_advisories.dart';

// --- Events ---

abstract class DarwinVaaEvent extends Equatable {
  const DarwinVaaEvent();
  @override
  List<Object?> get props => [];
}

class LoadAdvisories extends DarwinVaaEvent {
  const LoadAdvisories();
}

class RefreshAdvisories extends DarwinVaaEvent {
  const RefreshAdvisories();
}

class _AutoRefresh extends DarwinVaaEvent {
  const _AutoRefresh();
}

// --- States ---

abstract class DarwinVaaState extends Equatable {
  const DarwinVaaState();
  @override
  List<Object?> get props => [];
}

class DarwinVaaInitial extends DarwinVaaState {
  const DarwinVaaInitial();
}

class DarwinVaaLoading extends DarwinVaaState {
  const DarwinVaaLoading();
}

class DarwinVaaSuccess extends DarwinVaaState {
  final List<VolcanoAdvisory> advisories;
  final DateTime lastUpdated;

  const DarwinVaaSuccess({
    required this.advisories,
    required this.lastUpdated,
  });

  @override
  List<Object?> get props => [advisories, lastUpdated];
}

class DarwinVaaEmpty extends DarwinVaaState {
  final DateTime lastChecked;

  const DarwinVaaEmpty({required this.lastChecked});

  @override
  List<Object?> get props => [lastChecked];
}

class DarwinVaaError extends DarwinVaaState {
  final String message;

  const DarwinVaaError(this.message);

  @override
  List<Object?> get props => [message];
}

// --- BLoC ---

class DarwinVaaBloc extends Bloc<DarwinVaaEvent, DarwinVaaState> {
  final GetActiveAdvisories getActiveAdvisories;
  Timer? _autoRefreshTimer;

  /// Auto-refresh interval: 10 minutes.
  static const autoRefreshInterval = Duration(minutes: 10);

  DarwinVaaBloc({required this.getActiveAdvisories})
      : super(const DarwinVaaInitial()) {
    on<LoadAdvisories>(_onLoadAdvisories);
    on<RefreshAdvisories>(_onRefreshAdvisories);
    // ignore: no_leading_underscores_for_local_identifiers
    on<_AutoRefresh>(_onAutoRefresh);

    _startAutoRefresh();
  }

  void _startAutoRefresh() {
    _autoRefreshTimer?.cancel();
    _autoRefreshTimer = Timer.periodic(autoRefreshInterval, (_) {
      add(const _AutoRefresh());
    });
  }

  Future<void> _onLoadAdvisories(
    LoadAdvisories event,
    Emitter<DarwinVaaState> emit,
  ) async {
    emit(const DarwinVaaLoading());
    await _fetchAdvisories(emit);
  }

  Future<void> _onRefreshAdvisories(
    RefreshAdvisories event,
    Emitter<DarwinVaaState> emit,
  ) async {
    // Don't show loading state on refresh — keep the current data visible
    await _fetchAdvisories(emit);
  }

  Future<void> _onAutoRefresh(
    _AutoRefresh event,
    Emitter<DarwinVaaState> emit,
  ) async {
    // Silent refresh — don't change state to loading
    await _fetchAdvisories(emit);
  }

  Future<void> _fetchAdvisories(Emitter<DarwinVaaState> emit) async {
    try {
      final advisories = await getActiveAdvisories();
      final now = DateTime.now().toUtc();

      if (advisories.isEmpty) {
        emit(DarwinVaaEmpty(lastChecked: now));
      } else {
        emit(DarwinVaaSuccess(
          advisories: advisories,
          lastUpdated: now,
        ));
      }
    } catch (e) {
      // On refresh failure, keep existing data if we had it
      if (state is DarwinVaaSuccess) {
        return; // silently fail, keep old data
      }
      emit(DarwinVaaError(e.toString()));
    }
  }

  @override
  Future<void> close() {
    _autoRefreshTimer?.cancel();
    return super.close();
  }
}
