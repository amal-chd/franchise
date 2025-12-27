import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';

class DashboardSectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;

  const DashboardSectionHeader({super.key, required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(subtitle!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
        ],
      ],
    );
  }
}

class DashboardChartContainer extends StatelessWidget {
  final String title;
  final Widget chart;
  final double height;

  const DashboardChartContainer({super.key, required this.title, required this.chart, this.height = 300});

  @override
  Widget build(BuildContext context) {
    return PremiumGlassCard(
      padding: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
          const SizedBox(height: 24),
          SizedBox(height: height, child: chart),
        ],
      ),
    );
  }
}

class ModernLineChart extends StatelessWidget {
  final List<dynamic> data;
  const ModernLineChart({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const Center(child: Text('No data available'));

    return Container(
      padding: const EdgeInsets.only(top: 20, right: 20),
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (value) => FlLine(
              color: const Color(0xFFF1F5F9),
              strokeWidth: 1,
            ),
          ),
          titlesData: const FlTitlesData(show: false),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: data.asMap().entries.map((e) {
                final val = double.tryParse(e.value['revenue']?.toString() ?? '0') ?? 0;
                return FlSpot(e.key.toDouble(), val);
              }).toList(),
              isCurved: true,
              color: const Color(0xFF2563EB),
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF2563EB).withOpacity(0.2),
                    const Color(0xFF2563EB).withOpacity(0.0),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ],
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipColor: (_) => const Color(0xFF0F172A),
              getTooltipItems: (touchedSpots) {
                return touchedSpots.map((spot) {
                  return LineTooltipItem(
                    '₹${spot.y.toInt()}',
                    const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  );
                }).toList();
              },
            ),
          ),
        ),
      ),
    );
  }
}

class ZonePerformanceBars extends StatelessWidget {
  final List<dynamic> data;
  const ZonePerformanceBars({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const Center(child: Text('No data available'));

    return BarChart(
      BarChartData(
        gridData: const FlGridData(show: false),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                if (value.toInt() >= data.length) return const SizedBox();
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    data[value.toInt()]['zone'].toString().split(' ')[0],
                    style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                  ),
                );
              },
            ),
          ),
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        barGroups: data.asMap().entries.map((e) {
          return BarChartGroupData(
            x: e.key,
            barRods: [
              BarChartRodData(
                toY: double.parse(e.value['revenue'].toString()),
                color: const Color(0xFF0F172A),
                width: 16,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class OrderHealthPie extends StatelessWidget {
  final List<dynamic> data;
  const OrderHealthPie({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const Center(child: Text('No data available'));

    final colors = [
      const Color(0xFF2563EB),
      const Color(0xFF10B981),
      const Color(0xFFF59E0B),
      const Color(0xFFEF4444),
      const Color(0xFF8B5CF6),
    ];

    return PieChart(
      PieChartData(
        sectionsSpace: 4,
        centerSpaceRadius: 40,
        sections: data.asMap().entries.map((e) {
          return PieChartSectionData(
            value: double.parse(e.value['count'].toString()),
            title: '${e.value['status']}\n${e.value['count']}',
            radius: 50,
            titleStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
            color: colors[e.key % colors.length],
          );
        }).toList(),
      ),
    );
  }
}

class PremiumSkeleton extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const PremiumSkeleton({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 12,
  });

  @override
  State<PremiumSkeleton> createState() => _PremiumSkeletonState();
}

class _PremiumSkeletonState extends State<PremiumSkeleton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _animation = Tween<double>(begin: -1.0, end: 2.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              stops: [
                _animation.value - 0.3,
                _animation.value,
                _animation.value + 0.3,
              ],
              colors: [
                const Color(0xFFE2E8F0),
                const Color(0xFFF1F5F9),
                const Color(0xFFE2E8F0),
              ],
            ),
          ),
        );
      },
    );
  }
}

class IllustrativeState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onRetry;
  final String? retryLabel;

  const IllustrativeState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onRetry,
    this.retryLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 64, color: const Color(0xFF94A3B8)),
            ),
            const SizedBox(height: 32),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: const Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: onRetry,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                child: Text(retryLabel ?? 'Try Again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class PremiumSectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  const PremiumSectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title.toUpperCase(),
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF94A3B8),
            letterSpacing: 1.5,
          ),
        ),
        if (actionLabel != null && onAction != null)
          TextButton(
            onPressed: onAction,
            child: Text(
              actionLabel!,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF2563EB),
              ),
            ),
          ),
      ],
    );
  }
}

class PremiumGlassCard extends StatelessWidget {
  final Widget child;
  final double? padding;
  final Color? color;
  final double borderRadius;

  const PremiumGlassCard({
    super.key,
    required this.child,
    this.padding = 24,
    this.color,
    this.borderRadius = 24,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding != null ? EdgeInsets.all(padding!) : null,
      decoration: BoxDecoration(
        color: color ?? Colors.white,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}

class PremiumBottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;
  final List<PremiumNavItem> items;

  const PremiumBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isSelected = currentIndex == index;

          return _NavBarItem(
            icon: item.icon,
            label: item.label,
            isSelected: isSelected,
            badgeCount: item.badgeCount,
            onTap: () => onTap(index),
          );
        }).toList(),
      ),
    );
  }
}

class PremiumNavItem {
  final IconData icon;
  final String label;
  final int? badgeCount;

  PremiumNavItem({
    required this.icon,
    required this.label,
    this.badgeCount,
  });
}

class _NavBarItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final int? badgeCount;
  final VoidCallback onTap;

  const _NavBarItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    this.badgeCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2563EB) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  icon,
                  color: isSelected ? Colors.white : Colors.white.withOpacity(0.5),
                  size: 22,
                ),
                if (badgeCount != null && badgeCount! > 0)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        badgeCount! > 9 ? '9+' : badgeCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
